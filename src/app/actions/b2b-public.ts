"use server";

import { prisma } from "@/lib/db";

// ============================================
// UNIVERSITY VIEW (Side A)
// ============================================

export async function getUniversityLiveView(token: string) {
  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
    include: {
      university: { select: { name: true, logoUrl: true, country: true } },
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
      participantB: { select: { name: true, organization: true, country: true, contactPerson: true } },
    },
  });

  // Get completed meetings
  const completedMeetings = await prisma.b2BMeeting.findMany({
    where: {
      b2bEventId: participant.b2bEventId,
      participantAId: participant.id,
      status: "COMPLETED",
    },
    include: {
      participantB: { select: { name: true, organization: true, country: true, contactPerson: true } },
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
    activeMeeting,
    completedMeetings,
    waitingCount,
    stats: {
      completed: completedMeetings.length,
      totalParticipants: totalB,
    },
  };
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
