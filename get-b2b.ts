import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const b2bEvent = await prisma.b2BEvent.findUnique({
    where: { id: 'cmofma9sm0001rt0kpm6m9w80' }
  });
  console.log(b2bEvent);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
