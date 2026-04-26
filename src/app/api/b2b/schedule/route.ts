import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/b2b/schedule?token=xxx
// Public endpoint — no auth required
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const participant = await prisma.b2BParticipant.findUnique({
      where: { scheduleToken: token },
      include: {
        b2bEvent: {
          select: {
            id: true,
            name: true,
            date: true,
            startTime: true,
            endTime: true,
            slotDuration: true,
            location: true,
            isScheduleGenerated: true,
          },
        },
        meetingsAsB: {
          include: {
            participantA: {
              include: {
                university: {
                  select: {
                    name: true,
                    logoUrl: true,
                    country: true,
                  },
                },
              },
            },
          },
          orderBy: { timeSlot: "asc" },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      participant: {
        name: participant.name,
        organization: participant.organization,
      },
      event: participant.b2bEvent,
      meetings: participant.meetingsAsB.map((m) => ({
        id: m.id,
        timeSlot: m.timeSlot,
        endTime: m.endTime,
        tableNumber: m.tableNumber,
        status: m.status,
        universityName:
          m.participantA.university?.name || m.participantA.name,
        universityLogo: m.participantA.university?.logoUrl || null,
        universityCountry: m.participantA.university?.country || null,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch B2B schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
