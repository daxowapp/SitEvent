import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const event = await prisma.event.findUnique({
        where: { slug: "education-fair-istanbul-2025" }
    });
    console.log("Event in DB:", event);
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
