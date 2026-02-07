import { prisma } from "@/lib/db";

async function main() {
  const events = await prisma.event.findMany({
    select: {
      title: true,
      slug: true,
      city: true,
      country: true,
      cityRef: {
        select: {
          name: true,
          country: {
            select: { name: true }
          }
        }
      }
    }
  });

  console.log("Available Events:");
  events.forEach(e => {
    const locCity = e.cityRef?.name || e.city || "Unknown City";
    const locCountry = e.cityRef?.country.name || e.country || "Unknown Country";
    console.log(`- Title: ${e.title}`);
    console.log(`  Slug: ${e.slug}`);
    console.log(`  Location: ${locCity}, ${locCountry}`);
    console.log(`  Kiosk URL: http://localhost:3000/en/kiosk/${e.slug}`);
    console.log("---");
  });
}

main();
