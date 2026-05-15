import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findUnique({
    where: { id: 'cmofma9sm0001rt0kpm6m9w80' }
  });
  console.log("Current Event Status:", event?.status, event?.title);

  // If the user meant "take the event offline", maybe they mean status = FINISHED ?
  if (event) {
    const updated = await prisma.event.update({
      where: { id: 'cmofma9sm0001rt0kpm6m9w80' },
      data: { status: 'FINISHED' }
    });
    console.log("Updated Event Status:", updated.status);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
