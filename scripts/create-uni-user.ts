
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createUniversityUser(uniName: string, email: string) {
    console.log(`🔍 Checking for university: ${uniName}...`);

    let university = await prisma.university.findFirst({
        where: { name: { contains: uniName, mode: 'insensitive' } }
    });

    if (!university) {
        console.log(`⚠️ University not found. Creating ${uniName}...`);
        university = await prisma.university.create({
            data: {
                id: uniName.toLowerCase().replace(/\s+/g, '-'),
                name: uniName,
                country: "Turkey",
                city: "Antalya", // Assuming based on name
            }
        });
    }

    console.log(`✅ University ready: ${university.name}`);

    const password = "uni123"; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.universityUser.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword, // Reset password if exists
        },
        create: {
            email,
            passwordHash: hashedPassword,
            name: `${uniName} Representative`,
            universityId: university.id,
        }
    });

    console.log(`
🎉 User Created/Updated!
   University: ${university.name}
   Email: ${user.email}
   Password: ${password}
`);
}

// Run for Antalya Bilim
createUniversityUser("Antalya Bilim University", "info@antalya.edu.tr")
    .catch(console.error)
    .finally(() => prisma.$disconnect());
