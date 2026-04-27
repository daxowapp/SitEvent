"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function requireB2BAdmin() {
  const session = await auth();
  if (
    !session?.user ||
    !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)
  ) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ============================================
// LIVE DASHBOARD DATA
// ============================================

export async function getLiveDashboard(eventId: string) {
  const event = await prisma.b2BEvent.findUnique({
    where: { id: eventId },
    include: {
      participants: {
        include: {
          university: { select: { name: true, logoUrl: true, country: true } },
        },
      },
      meetings: {
        where: { status: { in: ["IN_PROGRESS", "COMPLETED"] } },
        include: {
          participantA: {
            include: {
              university: { select: { name: true, logoUrl: true } },
            },
          },
          participantB: true,
        },
        orderBy: { actualStart: "desc" },
      },
    },
  });

  if (!event) return null;

  const sideA = event.participants.filter((p) => p.side === "A");
  const sideB = event.participants.filter((p) => p.side === "B");

  const breakBufferMs = (event.breakBetweenMeetings ?? 5) * 60 * 1000;
  const nowMs = Date.now();

  // Check main break status — supports both HH:mm and ISO formats
  const nowDate = new Date();
  let isMainBreak = false;
  if (event.breakStart && event.breakEnd) {
    if (event.breakEnd.includes("T")) {
      // ISO format (dynamic break from live dashboard)
      isMainBreak = nowDate >= new Date(event.breakStart) && nowDate < new Date(event.breakEnd);
    } else {
      // HH:mm format (pre-configured break)
      const hhmm = `${nowDate.getHours().toString().padStart(2, "0")}:${nowDate.getMinutes().toString().padStart(2, "0")}`;
      isMainBreak = hhmm >= event.breakStart && hhmm < event.breakEnd;
    }
  }

  // Build university status cards with break awareness
  const universityCards = sideA.map((uni) => {
    const activeMeeting = event.meetings.find(
      (m) => m.participantAId === uni.id && m.status === "IN_PROGRESS"
    );
    const completedCount = event.meetings.filter(
      (m) => m.participantAId === uni.id && m.status === "COMPLETED"
    ).length;

    // Find last completed meeting to determine break status
    const lastCompleted = event.meetings
      .filter((m) => m.participantAId === uni.id && m.status === "COMPLETED" && m.actualEnd)
      .sort((a, b) => new Date(b.actualEnd!).getTime() - new Date(a.actualEnd!).getTime())[0];

    let status: "IN_MEETING" | "ON_BREAK" | "IDLE" = "IDLE";
    let breakEndsAt: string | null = null;

    if (activeMeeting) {
      status = "IN_MEETING";
    } else if (isMainBreak) {
      status = "ON_BREAK";
      breakEndsAt = event.breakEnd!;
    } else if (lastCompleted?.actualEnd && (nowMs - new Date(lastCompleted.actualEnd).getTime()) < breakBufferMs) {
      status = "ON_BREAK";
      const endsAt = new Date(new Date(lastCompleted.actualEnd).getTime() + breakBufferMs);
      breakEndsAt = endsAt.toISOString();
    }

    return {
      participant: uni,
      activeMeeting,
      completedCount,
      status,
      breakEndsAt,
    };
  });

  // Waiting queue (sorted by arrival time)
  const waitingQueue = sideB
    .filter((p) => p.liveStatus === "WAITING")
    .sort((a, b) => {
      if (!a.arrivedAt || !b.arrivedAt) return 0;
      return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
    });

  // Not arrived yet
  const notArrived = sideB.filter((p) => p.liveStatus === "NOT_ARRIVED");

  // In meeting
  const inMeeting = sideB.filter((p) => p.liveStatus === "IN_MEETING");

  // Done
  const done = sideB.filter((p) => p.liveStatus === "DONE");

  // Completed meetings for history
  const completedMeetings = event.meetings
    .filter((m) => m.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.actualEnd || 0).getTime() -
        new Date(a.actualEnd || 0).getTime()
    );

  const totalPossibleMeetings = sideA.length * sideB.length;
  const totalCompletedMeetings = completedMeetings.length;
  const onBreakCount = universityCards.filter((c) => c.status === "ON_BREAK").length;

  return {
    event,
    universityCards,
    waitingQueue,
    notArrived,
    inMeeting,
    done,
    completedMeetings,
    isMainBreak,
    stats: {
      totalUniversities: sideA.length,
      totalParticipants: sideB.length,
      totalCompleted: totalCompletedMeetings,
      totalPossible: totalPossibleMeetings,
      completionPercent: totalPossibleMeetings > 0
        ? Math.round((totalCompletedMeetings / totalPossibleMeetings) * 100)
        : 0,
      activeNow: universityCards.filter((c) => c.status === "IN_MEETING").length,
      idleNow: universityCards.filter((c) => c.status === "IDLE").length,
      onBreak: onBreakCount,
      waiting: waitingQueue.length,
    },
  };
}

// ============================================
// AUTO-ASSIGNMENT ALGORITHM
// ============================================

/**
 * Find the best university to assign a waiting participant to.
 * Priority:
 * 1. University is currently IDLE (no IN_PROGRESS meeting)
 * 2. Has the fewest completed meetings (load balance)
 * 3. Has not already met this participant
 */
async function autoAssign(eventId: string) {
  // Get event config first (needed for breaks + slot duration)
  const event = await prisma.b2BEvent.findUnique({
    where: { id: eventId },
    select: { slotDuration: true, breakStart: true, breakEnd: true, breakBetweenMeetings: true },
  });
  if (!event) return null;

  // Check if we're in the main break period — supports both HH:mm and ISO
  if (event.breakStart && event.breakEnd) {
    const nowDate = new Date();
    if (event.breakEnd.includes("T")) {
      // ISO format (dynamic break)
      if (nowDate >= new Date(event.breakStart) && nowDate < new Date(event.breakEnd)) {
        return null;
      }
    } else {
      // HH:mm format (pre-configured)
      const hhmm = `${nowDate.getHours().toString().padStart(2, "0")}:${nowDate.getMinutes().toString().padStart(2, "0")}`;
      if (hhmm >= event.breakStart && hhmm < event.breakEnd) {
        return null;
      }
    }
  }

  const breakBufferMs = (event.breakBetweenMeetings ?? 5) * 60 * 1000;
  const nowMs = Date.now();

  // Fetch all data in PARALLEL — 4 queries at once instead of sequential
  const [sideA, activeMeetings, allWaiting, completedMeetings] = await Promise.all([
    prisma.b2BParticipant.findMany({
      where: { b2bEventId: eventId, side: "A" },
    }),
    prisma.b2BMeeting.findMany({
      where: { b2bEventId: eventId, status: "IN_PROGRESS" },
      select: { participantAId: true },
    }),
    prisma.b2BParticipant.findMany({
      where: { b2bEventId: eventId, side: "B", liveStatus: "WAITING" },
      orderBy: { arrivedAt: "asc" },
    }),
    prisma.b2BMeeting.findMany({
      where: { b2bEventId: eventId, status: "COMPLETED" },
      select: { participantAId: true, participantBId: true, actualEnd: true },
      orderBy: { actualEnd: "desc" },
    }),
  ]);

  if (allWaiting.length === 0) return null;

  const busyUniIds = new Set(activeMeetings.map((m) => m.participantAId));

  // Build uni last-end map from completed meetings
  const uniLastEndMap = new Map<string, Date>();
  const lastMeetingEndMap = new Map<string, Date>();
  for (const m of completedMeetings) {
    if (m.actualEnd) {
      if (!uniLastEndMap.has(m.participantAId)) uniLastEndMap.set(m.participantAId, m.actualEnd);
      if (!lastMeetingEndMap.has(m.participantBId)) lastMeetingEndMap.set(m.participantBId, m.actualEnd);
    }
  }

  // Get idle universities — not in meeting AND break buffer has passed
  const idleUnis = sideA.filter((u) => {
    if (busyUniIds.has(u.id)) return false;
    const lastEnd = uniLastEndMap.get(u.id);
    if (lastEnd && (nowMs - lastEnd.getTime()) < breakBufferMs) return false;
    return true;
  });
  if (idleUnis.length === 0) return null;

  // Sort: fresh arrivals first, then by longest wait since last meeting
  const sortedWaiting = [...allWaiting].sort((a, b) => {
    const aLast = lastMeetingEndMap.get(a.id);
    const bLast = lastMeetingEndMap.get(b.id);
    if (!aLast && !bLast) {
      return new Date(a.arrivedAt || 0).getTime() - new Date(b.arrivedAt || 0).getTime();
    }
    if (!aLast) return -1;
    if (!bLast) return 1;
    return aLast.getTime() - bLast.getTime();
  });

  // Filter out participants still on their break buffer
  const readyWaiting = sortedWaiting.filter((p) => {
    const lastEnd = lastMeetingEndMap.get(p.id);
    if (lastEnd && (nowMs - lastEnd.getTime()) < breakBufferMs) return false;
    return true;
  });

  // Pre-fetch ALL meetings for this event in ONE query (eliminates N+1)
  const [allMeetings, uniMeetingCounts] = await Promise.all([
    prisma.b2BMeeting.findMany({
      where: { b2bEventId: eventId },
      select: { participantAId: true, participantBId: true, status: true },
    }),
    prisma.b2BMeeting.groupBy({
      by: ["participantAId"],
      where: { b2bEventId: eventId, status: { in: ["COMPLETED", "IN_PROGRESS"] } },
      _count: true,
    }),
  ]);

  // Build lookup: participantBId -> Set of university IDs they've met
  const metMap = new Map<string, Set<string>>();
  for (const m of allMeetings) {
    if (!metMap.has(m.participantBId)) metMap.set(m.participantBId, new Set());
    metMap.get(m.participantBId)!.add(m.participantAId);
  }

  const countMap = new Map(uniMeetingCounts.map((c) => [c.participantAId, c._count]));

  // Try each ready participant in priority order
  for (const nextWaiting of readyWaiting) {
    const metUniIds = metMap.get(nextWaiting.id) || new Set();

    if (metUniIds.size >= sideA.length) {
      await prisma.b2BParticipant.update({
        where: { id: nextWaiting.id },
        data: { liveStatus: "DONE" },
      });
      continue;
    }

    const candidates = idleUnis
      .filter((u) => !metUniIds.has(u.id))
      .sort((a, b) => (countMap.get(a.id) || 0) - (countMap.get(b.id) || 0));

    if (candidates.length === 0) continue;

    const bestUni = candidates[0];
    const meetingStart = new Date();
    const endTime = new Date(meetingStart.getTime() + event.slotDuration * 60 * 1000);

    const meeting = await prisma.b2BMeeting.create({
      data: {
        b2bEventId: eventId,
        participantAId: bestUni.id,
        participantBId: nextWaiting.id,
        timeSlot: meetingStart,
        endTime,
        status: "IN_PROGRESS",
        actualStart: meetingStart,
        tableNumber: sideA.indexOf(bestUni) + 1,
      },
    });

    await prisma.b2BParticipant.update({
      where: { id: nextWaiting.id },
      data: { liveStatus: "IN_MEETING", queuePosition: null },
    });

    return meeting;
  }

  return null;
}

/**
 * Try to assign ALL idle universities at once (batch assignment).
 * Called after check-in and after ending a meeting.
 */
async function batchAutoAssign(eventId: string) {
  let assigned = 0;
  // Keep assigning until no more matches possible
  while (true) {
    const result = await autoAssign(eventId);
    if (!result) break;
    assigned++;
  }
  return assigned;
}

/**
 * Periodic auto-assign tick — called by the admin dashboard every ~10s.
 * Handles the case where break buffers expire and new assignments
 * need to be triggered without a check-in or meeting-end event.
 */
export async function tickAutoAssign(eventId: string) {
  try {
    // Quick check: are there idle universities AND waiting participants?
    const [idleCount, waitingCount] = await Promise.all([
      prisma.b2BParticipant.count({
        where: {
          b2bEventId: eventId,
          side: "A",
          id: {
            notIn: (
              await prisma.b2BMeeting.findMany({
                where: { b2bEventId: eventId, status: "IN_PROGRESS" },
                select: { participantAId: true },
              })
            ).map((m) => m.participantAId),
          },
        },
      }),
      prisma.b2BParticipant.count({
        where: { b2bEventId: eventId, side: "B", liveStatus: "WAITING" },
      }),
    ]);

    if (idleCount === 0 || waitingCount === 0) return { assigned: 0 };

    const assigned = await batchAutoAssign(eventId);
    if (assigned > 0) {
      revalidatePath(`/admin/b2b/${eventId}/live`);
    }
    return { assigned };
  } catch {
    return { assigned: 0 };
  }
}

/**
 * Exported wrapper so b2b-public.ts can trigger auto-assign
 * after ending a meeting from the university side.
 */
export async function autoAssignFromPublic(eventId: string) {
  return batchAutoAssign(eventId);
}

/**
 * Force assign all — bypasses break buffers. For admin emergency use.
 */
export async function forceAssignAll(eventId: string) {
  await requireB2BAdmin();

  // Temporarily set break to 0, assign, then restore
  const event = await prisma.b2BEvent.findUnique({ where: { id: eventId } });
  if (!event) return { error: "Event not found" };

  const originalBreak = event.breakBetweenMeetings;

  await prisma.b2BEvent.update({
    where: { id: eventId },
    data: { breakBetweenMeetings: 0 },
  });

  const assigned = await batchAutoAssign(eventId);

  // Restore original break setting
  await prisma.b2BEvent.update({
    where: { id: eventId },
    data: { breakBetweenMeetings: originalBreak },
  });

  revalidatePath(`/admin/b2b/${eventId}/live`);
  return { success: true, assigned, message: `Force-assigned ${assigned} meeting(s)` };
}

/**
 * Update break buffer time from the live dashboard.
 */
export async function updateBreakBuffer(eventId: string, minutes: number) {
  await requireB2BAdmin();

  if (minutes < 0 || minutes > 30) return { error: "Break must be 0-30 minutes" };

  await prisma.b2BEvent.update({
    where: { id: eventId },
    data: { breakBetweenMeetings: minutes },
  });

  revalidatePath(`/admin/b2b/${eventId}/live`);
  return { success: true, message: `Break set to ${minutes} minutes` };
}

/**
 * Start a main break (e.g., lunch). Sets breakStart=now, breakEnd=now+duration.
 */
export async function startMainBreak(eventId: string, durationMinutes: number) {
  await requireB2BAdmin();

  if (durationMinutes < 5 || durationMinutes > 120) return { error: "Break must be 5-120 minutes" };

  const now = new Date();
  const end = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // Store as ISO strings so timezone is preserved correctly
  await prisma.b2BEvent.update({
    where: { id: eventId },
    data: {
      breakStart: now.toISOString(),
      breakEnd: end.toISOString(),
    },
  });

  revalidatePath(`/admin/b2b/${eventId}/live`);
  return { success: true, message: `Break started — ${durationMinutes} minutes` };
}

/**
 * End the main break immediately.
 */
export async function endMainBreak(eventId: string) {
  await requireB2BAdmin();

  await prisma.b2BEvent.update({
    where: { id: eventId },
    data: {
      breakStart: null,
      breakEnd: null,
    },
  });

  // Immediately try to assign
  const assigned = await batchAutoAssign(eventId);

  revalidatePath(`/admin/b2b/${eventId}/live`);
  return { success: true, assigned, message: `Break ended! ${assigned > 0 ? `${assigned} meeting(s) assigned.` : "Assignments will start shortly."}` };
}

// ============================================
// CHECK-IN
// ============================================

export async function checkInParticipant(participantId: string, email?: string) {
  // Run auth + participant lookup in PARALLEL
  const [, participant] = await Promise.all([
    requireB2BAdmin(),
    prisma.b2BParticipant.findUnique({ where: { id: participantId } }),
  ]);

  if (!participant) return { error: "Participant not found" };
  if (participant.liveStatus !== "NOT_ARRIVED") {
    return { error: "Participant already checked in" };
  }

  try {
    // Run max queue + scheduled cleanup in PARALLEL
    const [maxQueue] = await Promise.all([
      prisma.b2BParticipant.findFirst({
        where: { b2bEventId: participant.b2bEventId, liveStatus: "WAITING" },
        orderBy: { queuePosition: "desc" },
        select: { queuePosition: true },
      }),
      prisma.b2BMeeting.deleteMany({
        where: {
          b2bEventId: participant.b2bEventId,
          participantBId: participantId,
          status: "SCHEDULED",
        },
      }),
    ]);

    // Mark as WAITING + save email if provided
    await prisma.b2BParticipant.update({
      where: { id: participantId },
      data: {
        liveStatus: "WAITING",
        arrivedAt: new Date(),
        queuePosition: (maxQueue?.queuePosition || 0) + 1,
        ...(email ? { contactEmail: email } : {}),
      },
    });

    // Fire auto-assign in background — responds to user instantly
    const eventId = participant.b2bEventId;
    batchAutoAssign(eventId).catch(console.error);

    return {
      success: true,
      assigned: 0,
      message: "Checked in — assigning...",
    };
  } catch (error) {
    console.error("Check-in failed:", error);
    return { error: "Check-in failed" };
  }
}

// ============================================
// END MEETING
// ============================================

export async function endMeeting(meetingId: string) {
  await requireB2BAdmin();

  try {
    const meeting = await prisma.b2BMeeting.findUnique({
      where: { id: meetingId },
      include: { participantB: true },
    });
    if (!meeting) return { error: "Meeting not found" };
    if (meeting.status !== "IN_PROGRESS") {
      return { error: "Meeting is not in progress" };
    }

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

    // Auto-assign next participant to the freed university
    const assigned = await batchAutoAssign(meeting.b2bEventId);

    revalidatePath(`/admin/b2b/${meeting.b2bEventId}/live`);
    return {
      success: true,
      assigned,
      message: assigned > 0 ? "Meeting ended — next participant assigned!" : "Meeting ended.",
    };
  } catch (error) {
    console.error("End meeting failed:", error);
    return { error: "Failed to end meeting" };
  }
}

// ============================================
// UNDO CHECK-IN
// ============================================

export async function undoCheckIn(participantId: string) {
  await requireB2BAdmin();

  try {
    const participant = await prisma.b2BParticipant.findUnique({
      where: { id: participantId },
    });
    if (!participant) return { error: "Participant not found" };
    if (participant.liveStatus === "IN_MEETING") {
      return { error: "Cannot undo — participant is currently in a meeting" };
    }

    await prisma.b2BParticipant.update({
      where: { id: participantId },
      data: {
        liveStatus: "NOT_ARRIVED",
        arrivedAt: null,
        queuePosition: null,
      },
    });

    revalidatePath(`/admin/b2b/${participant.b2bEventId}/live`);
    return { success: true };
  } catch (error) {
    console.error("Undo check-in failed:", error);
    return { error: "Failed to undo check-in" };
  }
}

// ============================================
// CHECKOUT PARTICIPANT (works for ANY status)
// ============================================

export async function checkoutParticipant(participantId: string) {
  // Run auth + participant lookup in PARALLEL
  const [, participant] = await Promise.all([
    requireB2BAdmin(),
    prisma.b2BParticipant.findUnique({ where: { id: participantId } }),
  ]);

  if (!participant) return { error: "Participant not found" };
  if (participant.liveStatus === "NOT_ARRIVED") {
    return { error: "Participant is not checked in" };
  }

  try {
    // End any active meeting + reset status in PARALLEL
    await Promise.all([
      // End active meeting if IN_MEETING
      participant.liveStatus === "IN_MEETING"
        ? prisma.b2BMeeting.updateMany({
            where: {
              b2bEventId: participant.b2bEventId,
              participantBId: participant.id,
              status: "IN_PROGRESS",
            },
            data: { status: "COMPLETED", actualEnd: new Date() },
          })
        : Promise.resolve(),
      // Reset to NOT_ARRIVED
      prisma.b2BParticipant.update({
        where: { id: participantId },
        data: {
          liveStatus: "NOT_ARRIVED",
          arrivedAt: null,
          queuePosition: null,
        },
      }),
    ]);

    // Auto-assign freed university in background
    batchAutoAssign(participant.b2bEventId).catch(console.error);

    return { success: true, message: `${participant.name} checked out` };
  } catch (error) {
    console.error("Checkout failed:", error);
    return { error: "Failed to checkout participant" };
  }
}

// ============================================
// RESET LIVE SESSION
// ============================================

export async function resetLiveSession(eventId: string) {
  await requireB2BAdmin();

  try {
    // Delete all live meetings
    await prisma.b2BMeeting.deleteMany({
      where: { b2bEventId: eventId },
    });

    // Reset all Side B participants
    await prisma.b2BParticipant.updateMany({
      where: { b2bEventId: eventId, side: "B" },
      data: {
        liveStatus: "NOT_ARRIVED",
        arrivedAt: null,
        queuePosition: null,
      },
    });

    // Clear any active break
    await prisma.b2BEvent.update({
      where: { id: eventId },
      data: { breakStart: null, breakEnd: null },
    });

    revalidatePath(`/admin/b2b/${eventId}/live`);
    return { success: true };
  } catch (error) {
    console.error("Reset failed:", error);
    return { error: "Failed to reset live session" };
  }
}

// ============================================
// MARK PARTICIPANT AS DONE (left early / skip)
// ============================================

export async function markParticipantDone(participantId: string) {
  await requireB2BAdmin();

  try {
    const participant = await prisma.b2BParticipant.findUnique({
      where: { id: participantId },
    });
    if (!participant) return { error: "Participant not found" };

    // If they're in a meeting, end it first
    if (participant.liveStatus === "IN_MEETING") {
      const activeMeeting = await prisma.b2BMeeting.findFirst({
        where: {
          b2bEventId: participant.b2bEventId,
          participantBId: participant.id,
          status: "IN_PROGRESS",
        },
      });
      if (activeMeeting) {
        await prisma.b2BMeeting.update({
          where: { id: activeMeeting.id },
          data: { status: "COMPLETED", actualEnd: new Date() },
        });
      }
    }

    await prisma.b2BParticipant.update({
      where: { id: participantId },
      data: { liveStatus: "DONE", queuePosition: null },
    });

    // Try to assign next person to freed university
    await batchAutoAssign(participant.b2bEventId);

    revalidatePath(`/admin/b2b/${participant.b2bEventId}/live`);
    return { success: true };
  } catch (error) {
    console.error("Mark done failed:", error);
    return { error: "Failed to mark as done" };
  }
}

// ============================================
// BULK CHECK-IN (check in all remaining)
// ============================================

export async function bulkCheckIn(eventId: string) {
  await requireB2BAdmin();

  try {
    const notArrived = await prisma.b2BParticipant.findMany({
      where: { b2bEventId: eventId, side: "B", liveStatus: "NOT_ARRIVED" },
    });

    if (notArrived.length === 0) return { error: "No participants to check in" };

    const now = new Date();
    let queuePos = 0;

    // Get current max queue position
    const maxQueue = await prisma.b2BParticipant.findFirst({
      where: { b2bEventId: eventId, liveStatus: "WAITING" },
      orderBy: { queuePosition: "desc" },
      select: { queuePosition: true },
    });
    queuePos = maxQueue?.queuePosition || 0;

    // Check in all at once
    for (const p of notArrived) {
      queuePos++;
      await prisma.b2BParticipant.update({
        where: { id: p.id },
        data: {
          liveStatus: "WAITING",
          arrivedAt: now,
          queuePosition: queuePos,
        },
      });
    }

    // Auto-assign as many as possible
    const assigned = await batchAutoAssign(eventId);

    revalidatePath(`/admin/b2b/${eventId}/live`);
    return {
      success: true,
      checkedIn: notArrived.length,
      assigned,
      message: `${notArrived.length} checked in, ${assigned} assigned to universities.`,
    };
  } catch (error) {
    console.error("Bulk check-in failed:", error);
    return { error: "Bulk check-in failed" };
  }
}

// ============================================
// WALK-IN CHECK-IN (not on the list)
// ============================================

export async function walkInCheckIn(eventId: string, formData: FormData) {
  await requireB2BAdmin();

  try {
    const name = (formData.get("name") as string)?.trim();
    const contactEmail = (formData.get("contactEmail") as string)?.trim();
    const organization = (formData.get("organization") as string)?.trim() || null;
    const contactPerson = (formData.get("contactPerson") as string)?.trim() || null;
    const contactPhone = (formData.get("contactPhone") as string)?.trim() || null;

    if (!name) return { error: "Name is required" };
    if (!contactEmail) return { error: "Email is required" };

    // Get current max queue position
    const maxQueue = await prisma.b2BParticipant.findFirst({
      where: { b2bEventId: eventId, liveStatus: "WAITING" },
      orderBy: { queuePosition: "desc" },
      select: { queuePosition: true },
    });

    // Create participant and check in immediately
    const participant = await prisma.b2BParticipant.create({
      data: {
        b2bEventId: eventId,
        side: "B",
        name,
        contactEmail,
        organization,
        contactPerson,
        contactPhone,
        liveStatus: "WAITING",
        arrivedAt: new Date(),
        queuePosition: (maxQueue?.queuePosition || 0) + 1,
      },
    });

    // Auto-assign
    const assigned = await batchAutoAssign(eventId);

    revalidatePath(`/admin/b2b/${eventId}/live`);
    return {
      success: true,
      assigned,
      message: assigned > 0
        ? `${name} added and assigned to a university!`
        : `${name} added to the queue.`,
    };
  } catch (error) {
    console.error("Walk-in check-in failed:", error);
    return { error: "Failed to add walk-in participant" };
  }
}
