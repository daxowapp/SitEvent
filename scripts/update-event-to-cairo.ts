import { prisma } from "@/lib/db";

async function main() {
  const slug = "kiosk-test-event-1770468107880";
  
  // Find or create Cairo city reference
  let cairo = await prisma.city.findFirst({
    where: { name: "Cairo" }
  });

  if (!cairo) {
    const egypt = await prisma.country.upsert({
      where: { name: "Egypt" },
      update: {},
      create: {
        name: "Egypt",
        code: "EG",
        flagEmoji: "🇪🇬",
        timezone: "GMT+2"
      }
    });

    cairo = await prisma.city.create({
      data: {
        name: "Cairo",
        countryId: egypt.id
      }
    });
  }

  // Update Event
  await prisma.event.update({
    where: { slug },
    data: {
      cityId: cairo.id,
      city: "Cairo",
      country: "Egypt"
    }
  });

  console.log("Event updated to Cairo, Egypt");
}

main();
