import { prisma } from "@/lib/db";

async function main() {
  const slug = "kiosk-test-event-1770468107880";
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { cityRef: { include: { country: true } } }
  });

  console.log("Event Details:", JSON.stringify(event, null, 2));
}

main();
