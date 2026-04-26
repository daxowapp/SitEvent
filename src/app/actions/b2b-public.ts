"use server";

import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_5Vgi6tkf_5uvttzxuwuScumk4cnXVTtKv");

// ============================================
// UNIVERSITY VIEW (Side A)
// ============================================

export async function getUniversityLiveView(token: string) {
  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
    include: {
      university: {
        select: {
          name: true, logoUrl: true, country: true,
          files: { select: { id: true, fileName: true, fileUrl: true, fileType: true } },
        },
      },
      b2bEvent: { select: { id: true, name: true, startTime: true, endTime: true, slotDuration: true, location: true, date: true } },
    },
  });

  if (!participant || participant.side !== "A") return null;

  // Get active meeting
  const activeMeeting = await prisma.b2BMeeting.findFirst({
    where: {
      b2bEventId: participant.b2bEventId,
      participantAId: participant.id,
      status: "IN_PROGRESS",
    },
    include: {
      participantB: { select: { id: true, name: true, organization: true, country: true, contactPerson: true, contactEmail: true, contactPhone: true } },
    },
  });

  // Get completed meetings (with notes)
  const completedMeetings = await prisma.b2BMeeting.findMany({
    where: {
      b2bEventId: participant.b2bEventId,
      participantAId: participant.id,
      status: "COMPLETED",
    },
    include: {
      participantB: { select: { id: true, name: true, organization: true, country: true, contactPerson: true, contactEmail: true } },
    },
    orderBy: { actualEnd: "desc" },
  });

  // Get waiting queue size
  const waitingCount = await prisma.b2BParticipant.count({
    where: { b2bEventId: participant.b2bEventId, side: "B", liveStatus: "WAITING" },
  });

  // Get how many participants they haven't met yet
  const totalB = await prisma.b2BParticipant.count({
    where: { b2bEventId: participant.b2bEventId, side: "B" },
  });

  return {
    participant,
    event: participant.b2bEvent,
    universityName: participant.university?.name || participant.name,
    logoUrl: participant.university?.logoUrl,
    universityFiles: participant.university?.files || [],
    activeMeeting: activeMeeting ? { ...activeMeeting, notesA: activeMeeting.notesA || "" } : null,
    completedMeetings: completedMeetings.map((m) => ({
      ...m,
      notesA: m.notesA || "",
      documentsSent: m.documentsSent,
    })),
    waitingCount,
    stats: {
      completed: completedMeetings.length,
      totalParticipants: totalB,
    },
  };
}

// ============================================
// SAVE MEETING NOTES (token-based, no auth)
// ============================================

export async function saveMeetingNotes(token: string, meetingId: string, notes: string) {
  // Verify token owns this meeting
  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
  });
  if (!participant || participant.side !== "A") return { error: "Unauthorized" };

  const meeting = await prisma.b2BMeeting.findUnique({
    where: { id: meetingId },
  });
  if (!meeting || meeting.participantAId !== participant.id) return { error: "Unauthorized" };

  await prisma.b2BMeeting.update({
    where: { id: meetingId },
    data: { notesA: notes },
  });

  return { success: true };
}

// ============================================
// END MEETING BY TOKEN (university side, no admin auth)
// ============================================

export async function endMeetingByToken(token: string, meetingId: string) {
  // Verify token owns this meeting
  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
  });
  if (!participant || participant.side !== "A") return { error: "Unauthorized" };

  const meeting = await prisma.b2BMeeting.findUnique({
    where: { id: meetingId },
    include: { participantB: true },
  });
  if (!meeting || meeting.participantAId !== participant.id) return { error: "Unauthorized" };
  if (meeting.status !== "IN_PROGRESS") return { error: "Meeting is not in progress" };

  const now = new Date();

  // Complete the meeting
  await prisma.b2BMeeting.update({
    where: { id: meetingId },
    data: { status: "COMPLETED", actualEnd: now },
  });

  // Check if participant B has met all universities
  const totalUnis = await prisma.b2BParticipant.count({
    where: { b2bEventId: meeting.b2bEventId, side: "A" },
  });
  const metCount = await prisma.b2BMeeting.count({
    where: {
      b2bEventId: meeting.b2bEventId,
      participantBId: meeting.participantBId,
      status: "COMPLETED",
    },
  });

  // Update participant B status
  await prisma.b2BParticipant.update({
    where: { id: meeting.participantBId },
    data: {
      liveStatus: metCount >= totalUnis ? "DONE" : "WAITING",
      queuePosition: metCount >= totalUnis ? null : undefined,
    },
  });

  // Auto-assign next (inline — can't import batchAutoAssign from b2b-live due to circular deps)
  // The tickAutoAssign will also pick up any missed assignments within 10s
  const { autoAssignFromPublic } = await import("./b2b-live");
  const assigned = await autoAssignFromPublic(meeting.b2bEventId);

  return {
    success: true,
    assigned,
    message: assigned > 0 ? "Meeting ended — next participant assigned!" : "Meeting ended.",
  };
}

// ============================================
// EMAIL ALL NOTES TO UNIVERSITY
// ============================================

export async function emailNotesToUniversity(token: string) {
  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
    include: {
      university: { select: { name: true } },
      b2bEvent: { select: { name: true, date: true } },
    },
  });
  if (!participant || participant.side !== "A") return { error: "Unauthorized" };

  // Get university's contact email
  const uniEmail = participant.contactEmail || participant.university?.name;
  if (!participant.contactEmail) {
    return { error: "No email address set for this university participant" };
  }

  // Get all completed meetings with notes
  const meetings = await prisma.b2BMeeting.findMany({
    where: {
      b2bEventId: participant.b2bEventId,
      participantAId: participant.id,
      status: "COMPLETED",
    },
    include: {
      participantB: { select: { name: true, organization: true, country: true, contactPerson: true, contactEmail: true, contactPhone: true } },
    },
    orderBy: { actualStart: "asc" },
  });

  if (meetings.length === 0) return { error: "No completed meetings to email" };

  const universityName = participant.university?.name || participant.name;
  const eventName = participant.b2bEvent.name;

  const meetingsHtml = meetings.map((m, i) => {
    const duration = m.actualStart && m.actualEnd
      ? Math.round((new Date(m.actualEnd).getTime() - new Date(m.actualStart).getTime()) / 60000)
      : null;
    return `
      <div style="margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 8px; color: #1e293b;">Meeting ${i + 1}: ${m.participantB.name}</h3>
        <table style="width: 100%; font-size: 14px; color: #475569;">
          ${m.participantB.organization ? `<tr><td style="padding: 2px 0;">Organization:</td><td>${m.participantB.organization}</td></tr>` : ""}
          ${m.participantB.country ? `<tr><td style="padding: 2px 0;">Country:</td><td>${m.participantB.country}</td></tr>` : ""}
          ${m.participantB.contactPerson ? `<tr><td style="padding: 2px 0;">Contact:</td><td>${m.participantB.contactPerson}</td></tr>` : ""}
          ${m.participantB.contactEmail ? `<tr><td style="padding: 2px 0;">Email:</td><td><a href="mailto:${m.participantB.contactEmail}">${m.participantB.contactEmail}</a></td></tr>` : ""}
          ${m.participantB.contactPhone ? `<tr><td style="padding: 2px 0;">Phone:</td><td>${m.participantB.contactPhone}</td></tr>` : ""}
          ${duration ? `<tr><td style="padding: 2px 0;">Duration:</td><td>${duration} minutes</td></tr>` : ""}
        </table>
        ${m.notesA ? `<div style="margin-top: 12px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;"><p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Notes</p><p style="margin: 0; font-size: 14px; color: #334155; white-space: pre-wrap;">${m.notesA}</p></div>` : `<p style="margin-top: 8px; font-size: 13px; color: #94a3b8; font-style: italic;">No notes recorded</p>`}
      </div>
    `;
  }).join("");

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Events Team <onboarding@resend.dev>",
      to: participant.contactEmail,
      subject: `Your B2B Meeting Notes — ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f8; color: #333;">
          <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">B2B Meeting Notes</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">${universityName} — ${eventName}</p>
            </div>
            <div style="padding: 24px;">
              <p style="font-size: 16px; margin-bottom: 24px;">Here is a summary of your <strong>${meetings.length}</strong> meeting${meetings.length > 1 ? "s" : ""} from today's event:</p>
              ${meetingsHtml}
              <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 32px;">Powered by SitConnect</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw new Error(error.message);
    return { success: true, message: `Notes emailed to ${participant.contactEmail}` };
  } catch (err) {
    console.error("Email notes failed:", err);
    return { error: "Failed to send email" };
  }
}

// ============================================
// SEND UNIVERSITY FILES TO PARTICIPANT
// ============================================

export async function sendFilesToParticipant(token: string, meetingId: string) {
  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
    include: {
      university: {
        select: {
          name: true,
          files: { select: { fileName: true, fileUrl: true } },
        },
      },
    },
  });
  if (!participant || participant.side !== "A") return { error: "Unauthorized" };

  const meeting = await prisma.b2BMeeting.findUnique({
    where: { id: meetingId },
    include: {
      participantB: { select: { name: true, contactEmail: true } },
    },
  });
  if (!meeting || meeting.participantAId !== participant.id) return { error: "Unauthorized" };
  if (!meeting.participantB.contactEmail) return { error: "Participant has no email address" };

  const universityName = participant.university?.name || participant.name;
  const files = participant.university?.files || [];

  if (files.length === 0) return { error: "No files uploaded for this university" };

  const filesHtml = files.map((f) => `
    <div style="margin-bottom: 12px;">
      <a href="${f.fileUrl}" target="_blank" style="display: inline-block; background-color: #f1f5f9; color: #334155; padding: 12px 16px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; border: 1px solid #e2e8f0;">
        📄 ${f.fileName}
      </a>
    </div>
  `).join("");

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Events Team <onboarding@resend.dev>",
      to: meeting.participantB.contactEmail,
      subject: `Materials from ${universityName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f8; color: #333;">
          <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #E30A17 0%, #B30000 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">University Materials</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">From ${universityName}</p>
            </div>
            <div style="padding: 32px 24px;">
              <p style="font-size: 16px; margin-bottom: 24px;">Hi <strong>${meeting.participantB.name}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Thank you for meeting with <strong>${universityName}</strong>! Here are the materials we discussed:
              </p>
              <div style="margin-bottom: 32px;">${filesHtml}</div>
              <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 40px;">Powered by SitConnect</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw new Error(error.message);

    // Mark documents as sent
    await prisma.b2BMeeting.update({
      where: { id: meetingId },
      data: { documentsSent: true, documentsSentAt: new Date() },
    });

    return { success: true, message: `Files sent to ${meeting.participantB.contactEmail}` };
  } catch (err) {
    console.error("Send files failed:", err);
    return { error: "Failed to send files" };
  }
}

// ============================================
// PARTICIPANT VIEW (Side B)
// ============================================

export async function getParticipantLiveView(token: string) {
  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
    include: {
      b2bEvent: { select: { id: true, name: true, startTime: true, endTime: true, slotDuration: true, location: true, date: true } },
    },
  });

  if (!participant || participant.side !== "B") return null;

  // Get active meeting
  const activeMeeting = await prisma.b2BMeeting.findFirst({
    where: {
      b2bEventId: participant.b2bEventId,
      participantBId: participant.id,
      status: "IN_PROGRESS",
    },
    include: {
      participantA: {
        include: { university: { select: { name: true, logoUrl: true, country: true } } },
      },
    },
  });

  // Get completed meetings
  const completedMeetings = await prisma.b2BMeeting.findMany({
    where: {
      b2bEventId: participant.b2bEventId,
      participantBId: participant.id,
      status: "COMPLETED",
    },
    include: {
      participantA: {
        include: { university: { select: { name: true, logoUrl: true, country: true } } },
      },
    },
    orderBy: { actualEnd: "desc" },
  });

  // Queue position
  let queuePosition: number | null = null;
  if (participant.liveStatus === "WAITING") {
    const ahead = await prisma.b2BParticipant.count({
      where: {
        b2bEventId: participant.b2bEventId,
        side: "B",
        liveStatus: "WAITING",
        arrivedAt: { lt: participant.arrivedAt || new Date() },
      },
    });
    queuePosition = ahead + 1;
  }

  // Total universities
  const totalUnis = await prisma.b2BParticipant.count({
    where: { b2bEventId: participant.b2bEventId, side: "A" },
  });

  return {
    participant,
    event: participant.b2bEvent,
    activeMeeting,
    completedMeetings,
    queuePosition,
    stats: {
      completed: completedMeetings.length,
      totalUniversities: totalUnis,
    },
  };
}
