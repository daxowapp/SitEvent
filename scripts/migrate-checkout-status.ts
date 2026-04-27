/**
 * One-time migration: Find participants who were checked out with the old code
 * (set to NOT_ARRIVED) and update them to CHECKED_OUT.
 * 
 * Heuristic: Side B participant with NOT_ARRIVED status but has completed meetings
 * = was checked out.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
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
    select: { id: true, name: true, b2bEventId: true },
  });

  console.log(`Found ${participants.length} participants to migrate to CHECKED_OUT:`);
  participants.forEach((p) => console.log(`  - ${p.name} (${p.id})`));

  if (participants.length === 0) {
    console.log("Nothing to migrate.");
    await prisma.$disconnect();
    return;
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

  console.log(`✅ Updated ${result.count} participants to CHECKED_OUT`);
  await prisma.$disconnect();
}

migrate().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
