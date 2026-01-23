import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Testing query...");
    try {
        const slug = "education-fair-istanbul-2025";
        const event = await prisma.event.findUnique({
            where: { slug },
            include: {
                universities: {
                    include: {
                        university: true,
                    },
                },
                _count: {
                    select: { registrations: true },
                },
            },
        });
        console.log("Query success:", event ? "Found" : "Not Found");
        if (event) {
            console.log("Universities count:", event.universities.length);
        }
    } catch (error) {
        console.error("Query failed:", error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
