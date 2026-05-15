import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const b2bEvent = await prisma.b2BEvent.findUnique({
    where: { id: 'cmofma9sm0001rt0kpm6m9w80' }
  });
  console.log("Current B2B Event:", b2bEvent?.id, b2bEvent?.isActive);

  if (b2bEvent) {
    const updated = await prisma.b2BEvent.update({
      where: { id: 'cmofma9sm0001rt0kpm6m9w80' },
      data: { isActive: false }
    });
    console.log("Updated B2B Event isActive:", updated.isActive);
  } else {
    console.log("B2B Event not found");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
