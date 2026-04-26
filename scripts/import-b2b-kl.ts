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
  // Skip header
  const header = lines[0];
  console.log("Header:", header);

  const participants: Array<{
    name: string;
    contactPerson: string;
    organization: string;
    country: string;
    notes: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV with quoted fields containing commas
    const matches = lines[i].match(/(".*?"|[^,]*),?/g);
    if (!matches) continue;
    const values = matches.map((v) =>
      v.replace(/,?$/, "").replace(/^"(.*)"$/, "$1").trim()
    );

    const name = values[0] || "";
    const contactPerson = values[2] || "";
    const position = values[3] || "";
    const time = values[4] || "";
    const noteField = values[5] || "";

    if (!name) continue;

    participants.push({
      name,
      contactPerson,
      organization: "School",
      country: "Malaysia",
      notes: [position, `Preferred time: ${time}`, noteField]
        .filter(Boolean)
        .join(" | "),
    });
  }

  console.log(`Parsed ${participants.length} participants`);

  // Deduplicate by institution name
  const unique = new Map<string, (typeof participants)[0]>();
  for (const p of participants) {
    if (!unique.has(p.name)) {
      unique.set(p.name, p);
    } else {
      // Merge contact persons for same institution
      const existing = unique.get(p.name)!;
      existing.contactPerson += `, ${p.contactPerson}`;
      existing.notes += ` | ${p.notes}`;
    }
  }

  const deduped = Array.from(unique.values());
  console.log(`After dedup: ${deduped.length} unique institutions`);

  // Insert
  const result = await prisma.b2BParticipant.createMany({
    data: deduped.map((p) => ({
      b2bEventId: B2B_EVENT_ID,
      side: "B",
      name: p.name,
      contactPerson: p.contactPerson || null,
      contactEmail: null,
      contactPhone: null,
      organization: p.organization,
      country: p.country,
      notes: p.notes || null,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Imported ${result.count} participants as Side B`);

  // Verify
  const count = await prisma.b2BParticipant.count({
    where: { b2bEventId: B2B_EVENT_ID, side: "B" },
  });
  console.log(`Total Side B participants in event: ${count}`);

  await prisma.$disconnect();
}

main().catch(console.error);
