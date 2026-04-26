"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { b2bEventSchema, b2bParticipantSchema } from "@/lib/validations";
import {
  generateTimeSlots,
  generateSchedule,
  validateCapacity,
} from "@/lib/b2b-scheduler";

// ============================================
// AUTH HELPER
// ============================================

async function requireB2BAdmin() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as any).type !== "ADMIN" ||
    !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)
  ) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ============================================
// B2B TOGGLE FOR MAIN EVENTS
// ============================================

export async function enableB2BForEvent(
  mainEventId: string,
  config: {
    startTime: string;
    endTime: string;
    slotDuration: number;
    breakStart?: string;
    breakEnd?: string;
  }
) {
  const user = await requireB2BAdmin();

  try {
    const mainEvent = await prisma.event.findUnique({
      where: { id: mainEventId },
      include: { b2bEvent: true },
    });

    if (!mainEvent) return { error: "Event not found" };
    if (mainEvent.b2bEvent) return { error: "B2B is already enabled for this event", b2bEventId: mainEvent.b2bEvent.id };

    const slug = `b2b-${mainEvent.slug}`;
    const b2bEvent = await prisma.b2BEvent.create({
      data: {
        name: `B2B — ${mainEvent.title}`,
        slug,
        date: mainEvent.startDateTime,
        startTime: config.startTime,
        endTime: config.endTime,
        slotDuration: config.slotDuration,
        breakStart: config.breakStart || null,
        breakEnd: config.breakEnd || null,
        location: mainEvent.venueName || null,
        description: `B2B Matchmaking for ${mainEvent.title}`,
        eventId: mainEventId,
        createdById: user.id!,
      },
    });

    revalidatePath(`/admin/events/${mainEventId}`);
    revalidatePath("/admin/b2b");
    return { success: true, b2bEventId: b2bEvent.id };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A B2B event with this slug already exists" };
    }
    console.error("Failed to enable B2B:", error);
    return { error: "Failed to enable B2B" };
  }
}

export async function disableB2BForEvent(mainEventId: string) {
  await requireB2BAdmin();

  try {
    const b2bEvent = await prisma.b2BEvent.findUnique({
      where: { eventId: mainEventId },
      include: { _count: { select: { meetings: true } } },
    });

    if (!b2bEvent) return { error: "No B2B event linked to this event" };

    if (b2bEvent._count.meetings > 0) {
      return { error: "Cannot disable B2B — there are existing meetings. Clear the schedule first from the B2B management page." };
    }

    await prisma.b2BEvent.delete({ where: { id: b2bEvent.id } });

    revalidatePath(`/admin/events/${mainEventId}`);
    revalidatePath("/admin/b2b");
    return { success: true };
  } catch (error) {
    console.error("Failed to disable B2B:", error);
    return { error: "Failed to disable B2B" };
  }
}

export async function getB2BForEvent(mainEventId: string) {
  return prisma.b2BEvent.findUnique({
    where: { eventId: mainEventId },
    include: {
      _count: { select: { participants: true, meetings: true } },
      participants: { select: { side: true } },
    },
  });
}

// ============================================
// B2B EVENT CRUD
// ============================================

export async function createB2BEvent(formData: FormData) {
  const user = await requireB2BAdmin();

  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    date: formData.get("date") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    slotDuration: parseInt(formData.get("slotDuration") as string) || 20,
    breakStart: (formData.get("breakStart") as string) || "",
    breakEnd: (formData.get("breakEnd") as string) || "",
    location: (formData.get("location") as string) || "",
    description: (formData.get("description") as string) || "",
  };

  const parsed = b2bEventSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  try {
    const event = await prisma.b2BEvent.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        date: new Date(parsed.data.date),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        slotDuration: parsed.data.slotDuration,
        breakStart: parsed.data.breakStart || null,
        breakEnd: parsed.data.breakEnd || null,
        location: parsed.data.location || null,
        description: parsed.data.description || null,
        createdById: user.id!,
      },
    });

    revalidatePath("/admin/b2b");
    return { success: true, eventId: event.id };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "An event with this slug already exists" };
    }
    console.error("Failed to create B2B event:", error);
    return { error: "Failed to create event" };
  }
}

export async function updateB2BEvent(eventId: string, formData: FormData) {
  await requireB2BAdmin();

  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    date: formData.get("date") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    slotDuration: parseInt(formData.get("slotDuration") as string) || 20,
    breakStart: (formData.get("breakStart") as string) || "",
    breakEnd: (formData.get("breakEnd") as string) || "",
    location: (formData.get("location") as string) || "",
    description: (formData.get("description") as string) || "",
  };

  const parsed = b2bEventSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  try {
    await prisma.b2BEvent.update({
      where: { id: eventId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        date: new Date(parsed.data.date),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        slotDuration: parsed.data.slotDuration,
        breakStart: parsed.data.breakStart || null,
        breakEnd: parsed.data.breakEnd || null,
        location: parsed.data.location || null,
        description: parsed.data.description || null,
      },
    });

    revalidatePath(`/admin/b2b/${eventId}`);
    revalidatePath("/admin/b2b");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "An event with this slug already exists" };
    }
    console.error("Failed to update B2B event:", error);
    return { error: "Failed to update event" };
  }
}

export async function deleteB2BEvent(eventId: string) {
  await requireB2BAdmin();

  try {
    await prisma.b2BEvent.delete({ where: { id: eventId } });
    revalidatePath("/admin/b2b");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete B2B event:", error);
    return { error: "Failed to delete event" };
  }
}

// ============================================
// PARTICIPANT MANAGEMENT
// ============================================

export async function addUniversityToB2B(eventId: string, universityId: string) {
  await requireB2BAdmin();

  try {
    const university = await prisma.university.findUnique({
      where: { id: universityId },
    });

    if (!university) return { error: "University not found" };

    await prisma.b2BParticipant.create({
      data: {
        b2bEventId: eventId,
        side: "A",
        universityId,
        name: university.name,
        contactEmail: university.contactEmail,
        contactPhone: university.contactPhone,
        country: university.country,
      },
    });

    revalidatePath(`/admin/b2b/${eventId}`);
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "This university is already in this event" };
    }
    console.error("Failed to add university:", error);
    return { error: "Failed to add university" };
  }
}

export async function addParticipantB(eventId: string, formData: FormData) {
  await requireB2BAdmin();

  const raw = {
    name: formData.get("name") as string,
    contactPerson: (formData.get("contactPerson") as string) || "",
    contactEmail: (formData.get("contactEmail") as string) || "",
    contactPhone: (formData.get("contactPhone") as string) || "",
    organization: (formData.get("organization") as string) || "",
    country: (formData.get("country") as string) || "",
    notes: (formData.get("notes") as string) || "",
  };
  const arrivalTime = (formData.get("arrivalTime") as string) || null;

  const parsed = b2bParticipantSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  try {
    await prisma.b2BParticipant.create({
      data: {
        b2bEventId: eventId,
        side: "B",
        name: parsed.data.name,
        contactPerson: parsed.data.contactPerson || null,
        contactEmail: parsed.data.contactEmail || null,
        contactPhone: parsed.data.contactPhone || null,
        organization: parsed.data.organization || null,
        country: parsed.data.country || null,
        notes: parsed.data.notes || null,
        arrivalTime,
      },
    });

    revalidatePath(`/admin/b2b/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add participant:", error);
    return { error: "Failed to add participant" };
  }
}

export async function importParticipantsB(
  eventId: string,
  participants: Array<{
    name: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    organization?: string;
    country?: string;
    notes?: string;
    arrivalTime?: string;
  }>
) {
  await requireB2BAdmin();

  try {
    const created = await prisma.b2BParticipant.createMany({
      data: participants.map((p) => ({
        b2bEventId: eventId,
        side: "B",
        name: p.name,
        contactPerson: p.contactPerson || null,
        contactEmail: p.contactEmail || null,
        contactPhone: p.contactPhone || null,
        organization: p.organization || null,
        country: p.country || null,
        notes: p.notes || null,
        arrivalTime: p.arrivalTime || null,
      })),
      skipDuplicates: true,
    });

    revalidatePath(`/admin/b2b/${eventId}`);
    return { success: true, count: created.count };
  } catch (error) {
    console.error("Failed to import participants:", error);
    return { error: "Failed to import participants" };
  }
}

export async function removeParticipant(participantId: string) {
  await requireB2BAdmin();

  try {
    const participant = await prisma.b2BParticipant.findUnique({
      where: { id: participantId },
    });
    if (!participant) return { error: "Participant not found" };

    await prisma.b2BParticipant.delete({ where: { id: participantId } });

    revalidatePath(`/admin/b2b/${participant.b2bEventId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove participant:", error);
    return { error: "Failed to remove participant" };
  }
}

export async function updateParticipantB(participantId: string, formData: FormData) {
  await requireB2BAdmin();

  try {
    const participant = await prisma.b2BParticipant.findUnique({
      where: { id: participantId },
    });
    if (!participant) return { error: "Participant not found" };

    await prisma.b2BParticipant.update({
      where: { id: participantId },
      data: {
        name: (formData.get("name") as string) || participant.name,
        contactPerson: (formData.get("contactPerson") as string) || null,
        contactEmail: (formData.get("contactEmail") as string) || null,
        contactPhone: (formData.get("contactPhone") as string) || null,
        organization: (formData.get("organization") as string) || null,
        country: (formData.get("country") as string) || null,
        arrivalTime: (formData.get("arrivalTime") as string) || null,
      },
    });

    revalidatePath(`/admin/b2b/${participant.b2bEventId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update participant:", error);
    return { error: "Failed to update participant" };
  }
}

// ============================================
// SCHEDULE GENERATION
// ============================================

export async function generateB2BSchedule(eventId: string) {
  await requireB2BAdmin();

  try {
    const event = await prisma.b2BEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
      },
    });

    if (!event) return { error: "Event not found" };

    const sideA = event.participants.filter((p) => p.side === "A");
    const sideB = event.participants.filter((p) => p.side === "B");

    if (sideA.length === 0) return { error: "No universities (Side A) added yet" };
    if (sideB.length === 0) return { error: "No participants (Side B) added yet" };

    const slotDuration = event.slotDuration;

    // Generate time slots with current duration
    const timeSlots = generateTimeSlots(
      event.date,
      event.startTime,
      event.endTime,
      slotDuration,
      event.breakStart,
      event.breakEnd
    );

    if (timeSlots.length === 0) {
      return { error: "No time slots available. Check event start/end times and slot duration." };
    }

    const validation = validateCapacity(sideA.length, sideB.length, timeSlots.length);

    // Build arrival times map for Side B
    const arrivalTimes = new Map<string, string | null>();
    for (const p of sideB) {
      arrivalTimes.set(p.id, p.arrivalTime || null);
    }

    // Generate schedule
    const result = generateSchedule(
      sideA.map((p) => p.id),
      sideB.map((p) => p.id),
      timeSlots,
      arrivalTimes
    );

    if (!result.success) {
      return { error: result.error || "Schedule generation failed" };
    }

    // Clear existing meetings
    await prisma.b2BMeeting.deleteMany({ where: { b2bEventId: eventId } });

    // Create new meetings in batch
    await prisma.b2BMeeting.createMany({
      data: result.meetings.map((m) => ({
        b2bEventId: eventId,
        participantAId: m.participantAId,
        participantBId: m.participantBId,
        timeSlot: m.timeSlot,
        endTime: m.endTime,
        tableNumber: m.tableNumber,
      })),
    });

    // Mark event as schedule generated
    await prisma.b2BEvent.update({
      where: { id: eventId },
      data: { isScheduleGenerated: true },
    });

    revalidatePath(`/admin/b2b/${eventId}`);

    return {
      success: true,
      meetingsCreated: result.meetings.length,
      validation: result.validation,
      adjusted: result.adjusted,
    };
  } catch (error) {
    console.error("Failed to generate schedule:", error);
    return { error: "Failed to generate schedule" };
  }
}

export async function clearB2BSchedule(eventId: string) {
  await requireB2BAdmin();

  try {
    await prisma.b2BMeeting.deleteMany({ where: { b2bEventId: eventId } });
    await prisma.b2BEvent.update({
      where: { id: eventId },
      data: { isScheduleGenerated: false },
    });

    revalidatePath(`/admin/b2b/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear schedule:", error);
    return { error: "Failed to clear schedule" };
  }
}

// ============================================
// MEETING MANAGEMENT
// ============================================

export async function updateMeetingNotes(
  meetingId: string,
  notes: string,
  side: "A" | "B" = "A"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    await prisma.b2BMeeting.update({
      where: { id: meetingId },
      data: side === "A" ? { notesA: notes } : { notesB: notes },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update meeting notes:", error);
    return { error: "Failed to update notes" };
  }
}

export async function updateMeetingStatus(
  meetingId: string,
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
) {
  await requireB2BAdmin();

  try {
    await prisma.b2BMeeting.update({
      where: { id: meetingId },
      data: { status },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update meeting status:", error);
    return { error: "Failed to update status" };
  }
}

export async function markDocumentsSent(meetingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    await prisma.b2BMeeting.update({
      where: { id: meetingId },
      data: {
        documentsSent: true,
        documentsSentAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark documents sent:", error);
    return { error: "Failed to mark documents sent" };
  }
}

// ============================================
// DATA FETCHING
// ============================================

export async function getB2BEvents() {
  await requireB2BAdmin();

  return prisma.b2BEvent.findMany({
    include: {
      _count: {
        select: {
          participants: true,
          meetings: true,
        },
      },
      participants: {
        select: {
          side: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getB2BEvent(eventId: string) {
  return prisma.b2BEvent.findUnique({
    where: { id: eventId },
    include: {
      participants: {
        include: {
          university: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              country: true,
            },
          },
        },
        orderBy: [{ side: "asc" }, { name: "asc" }],
      },
      meetings: {
        include: {
          participantA: {
            include: {
              university: {
                select: { name: true, logoUrl: true },
              },
            },
          },
          participantB: true,
        },
        orderBy: [{ timeSlot: "asc" }, { tableNumber: "asc" }],
      },
      createdBy: {
        select: { name: true },
      },
    },
  });
}

export async function getUniversitiesForB2B(eventId: string) {
  // Get B2B event to check if it's linked to a main event
  const b2bEvent = await prisma.b2BEvent.findUnique({
    where: { id: eventId },
    select: { eventId: true },
  });

  // Get universities already added to this B2B event
  const existing = await prisma.b2BParticipant.findMany({
    where: { b2bEventId: eventId, side: "A" },
    select: { universityId: true },
  });

  const existingIds = existing
    .map((p) => p.universityId)
    .filter((id): id is string => id !== null);

  // If linked to a main event, only show universities participating in that event
  if (b2bEvent?.eventId) {
    const eventParticipants = await prisma.eventParticipating.findMany({
      where: { eventId: b2bEvent.eventId },
      select: { universityId: true },
    });

    const participatingIds = eventParticipants.map((p) => p.universityId);
    // Filter: must be in event participants AND not already in B2B
    const eligibleIds = participatingIds.filter((id) => !existingIds.includes(id));

    if (eligibleIds.length === 0) return [];

    return prisma.university.findMany({
      where: {
        isActive: true,
        id: { in: eligibleIds },
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        country: true,
      },
      orderBy: { name: "asc" },
    });
  }

  // Standalone B2B event: show all active universities
  return prisma.university.findMany({
    where: {
      isActive: true,
      id: { notIn: existingIds },
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      country: true,
    },
    orderBy: { name: "asc" },
  });
}

// Get schedule for a Side B participant by token (public)
export async function getB2BScheduleByToken(token: string) {
  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
    include: {
      b2bEvent: true,
      meetingsAsB: {
        include: {
          participantA: {
            include: {
              university: {
                select: { name: true, logoUrl: true, country: true },
              },
            },
          },
        },
        orderBy: { timeSlot: "asc" },
      },
    },
  });

  return participant;
}

// Get schedule for a university in a B2B event
export async function getUniversityB2BSchedule(
  universityId: string,
  eventId: string
) {
  const participant = await prisma.b2BParticipant.findFirst({
    where: {
      b2bEventId: eventId,
      universityId,
      side: "A",
    },
    include: {
      b2bEvent: true,
      meetingsAsA: {
        include: {
          participantB: true,
        },
        orderBy: { timeSlot: "asc" },
      },
    },
  });

  return participant;
}
