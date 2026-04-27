import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all Side B participants who are NOT_ARRIVED but have completed meetings
  const participants = await prisma.b2BParticipant.findMany({
    where: {
      side: "B",
      liveStatus: "NOT_ARRIVED",
      meetingsAsB: {
        some: {
          status: "COMPLETED",
        },
      },
    },
    select: { id: true, name: true },
  });

  if (participants.length === 0) {
    return NextResponse.json({ message: "Nothing to migrate", count: 0 });
  }

  // Batch update
  const result = await prisma.b2BParticipant.updateMany({
    where: {
      id: { in: participants.map((p) => p.id) },
    },
    data: {
      liveStatus: "CHECKED_OUT",
    },
  });

  return NextResponse.json({
    message: `Migrated ${result.count} participants to CHECKED_OUT`,
    count: result.count,
    participants: participants.map((p) => p.name),
  });
}
