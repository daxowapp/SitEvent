
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const email = "usher@test.com";
    const accessCode = "123456";

    console.log(`Seeding Usher with code ${accessCode}...`);

    const user = await prisma.adminUser.upsert({
        where: { email },
        update: {
            accessCode: accessCode,
            role: "USHER",
        },
        create: {
            email,
            name: "Fast Usher",
            role: "USHER",
            accessCode: accessCode,
            passwordHash: "", // No password needed
        },
    });

    console.log("Varied User:", user);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
