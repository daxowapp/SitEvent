
import { prisma } from "./src/lib/db";

async function main() {
  const email = "info@antalya.edu.tr";
  
  console.log(`Checking participation for: ${email}`);

  const university = await prisma.university.findFirst({
    where: {
      users: {
        some: {
          email: email
        }
      }
    },
    include: {
      events: {
        include: {
          event: true
        }
      }
    }
  });

  if (!university) {
    console.log("University not found!");
    return;
  }

  console.log(`University ID: ${university.id}`);
  console.log(`Name: ${university.name}`);
  console.log("--- Participations ---");
  
  if (university.events.length === 0) {
      console.log("No partial events found.");
  }

  university.events.forEach(p => {
    console.log(`Event: ${p.event.title} | Status: ${p.status} | ID: ${p.eventId}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
