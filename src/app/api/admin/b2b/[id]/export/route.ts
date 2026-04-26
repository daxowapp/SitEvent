import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/b2b/[id]/export?format=csv
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as any).type !== "ADMIN" ||
    !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") || "csv";

  try {
    const event = await prisma.b2BEvent.findUnique({
      where: { id },
      include: {
        meetings: {
          include: {
            participantA: {
              include: {
                university: { select: { name: true } },
              },
            },
            participantB: true,
          },
          orderBy: [{ timeSlot: "asc" }, { tableNumber: "asc" }],
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (format === "csv") {
      const headers = [
        "Time",
        "End Time",
        "Table",
        "University (Side A)",
        "Participant (Side B)",
        "Organization",
        "Contact Person",
        "Contact Email",
        "Status",
        "Notes (University)",
      ];

      const rows = event.meetings.map((m) => [
        new Date(m.timeSlot).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        new Date(m.endTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        m.tableNumber?.toString() || "",
        m.participantA.university?.name || m.participantA.name,
        m.participantB.name,
        m.participantB.organization || "",
        m.participantB.contactPerson || "",
        m.participantB.contactEmail || "",
        m.status,
        (m.notesA || "").replace(/"/g, '""'),
      ]);

      const csv =
        headers.join(",") +
        "\n" +
        rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${event.slug}-schedule.csv"`,
        },
      });
    }

    // Return JSON for other formats
    return NextResponse.json({
      event: {
        name: event.name,
        date: event.date,
        location: event.location,
      },
      meetings: event.meetings.map((m) => ({
        time: m.timeSlot,
        endTime: m.endTime,
        table: m.tableNumber,
        university: m.participantA.university?.name || m.participantA.name,
        participant: m.participantB.name,
        organization: m.participantB.organization,
        status: m.status,
      })),
    });
  } catch (error) {
    console.error("Failed to export B2B schedule:", error);
    return NextResponse.json(
      { error: "Failed to export schedule" },
      { status: 500 }
    );
  }
}
