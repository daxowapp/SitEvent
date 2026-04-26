import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

const B2B_EVENT_ID = "cmof9ifl70001qt0kj41b6age";

async function main() {
  const csv = fs.readFileSync(
    "./src/components/admin/b2b/Schools follow up - KL B2B.csv",
    "utf-8"
  );

  const lines = csv.split("\n").filter(Boolean);
  const header = lines[0];
  console.log("Header:", header);

  // Parse CSV with arrival times
  const csvData: Array<{ name: string; arrivalTime: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const matches = lines[i].match(/(".*?"|[^,]*),?/g);
    if (!matches) continue;
    const values = matches.map((v) =>
      v.replace(/,?$/, "").replace(/^"(.*)"$/, "$1").trim()
    );

    const name = values[0] || "";
    const time = values[4] || "";

    if (!name || !time) continue;

    // Normalize time format: "11:00", "12:00", "14:00", "15:00"
    const normalizedTime = time.includes(":") ? time : `${time}:00`;

    csvData.push({ name, arrivalTime: normalizedTime });
  }

  console.log(`Parsed ${csvData.length} entries with arrival times`);

  // Get all Side B participants for this event
  const participants = await prisma.b2BParticipant.findMany({
    where: { b2bEventId: B2B_EVENT_ID, side: "B" },
    select: { id: true, name: true },
  });

  let updated = 0;
  for (const p of participants) {
    // Find matching CSV row (case-insensitive)
    const match = csvData.find(
      (c) => c.name.toLowerCase() === p.name.toLowerCase()
    );

    if (match) {
      await prisma.b2BParticipant.update({
        where: { id: p.id },
        data: { arrivalTime: match.arrivalTime },
      });
      console.log(`✅ ${p.name} → ${match.arrivalTime}`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated}/${participants.length} participants with arrival times`);
  await prisma.$disconnect();
}

main().catch(console.error);
