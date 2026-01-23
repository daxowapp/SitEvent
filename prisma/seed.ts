import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting seed...");

    // Create Super Admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await prisma.adminUser.upsert({
        where: { email: "admin@studyinturkiye.com" },
        update: {},
        create: {
            name: "Admin User",
            email: "admin@studyinturkiye.com",
            passwordHash: hashedPassword,
            role: "SUPER_ADMIN",
            isActive: true,
        },
    });

    console.log(`✅ Created admin user: ${admin.email}`);

    // Create sample universities
    const universities = await Promise.all([
        prisma.university.upsert({
            where: { id: "uni-1" },
            update: {},
            create: {
                id: "uni-1",
                name: "Istanbul University",
                website: "https://www.istanbul.edu.tr",
                country: "Turkey",
                city: "Istanbul",
                description: "One of the oldest and most prestigious universities in Turkey.",
            },
        }),
        prisma.university.upsert({
            where: { id: "uni-2" },
            update: {},
            create: {
                id: "uni-2",
                name: "Ankara University",
                website: "https://www.ankara.edu.tr",
                country: "Turkey",
                city: "Ankara",
                description: "A leading research university in the capital.",
            },
        }),
        prisma.university.upsert({
            where: { id: "uni-3" },
            update: {},
            create: {
                id: "uni-3",
                name: "Bogazici University",
                website: "https://www.boun.edu.tr",
                country: "Turkey",
                city: "Istanbul",
                description: "Top-ranked university with English-medium education.",
            },
        }),
    ]);

    console.log(`✅ Created ${universities.length} universities`);

    // Create University User Login
    const uniPassword = await bcrypt.hash("uni123", 10);
    await prisma.universityUser.upsert({
        where: { email: "uni@istanbul.edu.tr" },
        update: {},
        create: {
            email: "uni@istanbul.edu.tr",
            passwordHash: uniPassword,
            name: "Istanbul Uni Rep",
            universityId: "uni-1",
        }
    });

    console.log(`✅ Created university portal user: uni@istanbul.edu.tr`);

    // Create sample event
    const event = await prisma.event.upsert({
        where: { slug: "education-fair-istanbul-2025" },
        update: {},
        create: {
            title: "Education Fair Istanbul 2025",
            slug: "education-fair-istanbul-2025",
            country: "Turkey",
            city: "Istanbul",
            venueName: "Istanbul Congress Center",
            venueAddress: "Darülbedai Cad. No:3, Harbiye",
            mapUrl: "https://maps.google.com/?q=Istanbul+Congress+Center",
            startDateTime: new Date("2026-03-15T10:00:00"), // Set to 2026 for future event
            endDateTime: new Date("2026-03-15T18:00:00"),
            timezone: "Europe/Istanbul",
            description: "Join us for the biggest education fair in Turkey! Meet representatives from top Turkish universities and learn about study opportunities.\n\nHighlights:\n- 50+ universities\n- Scholarship information\n- Application support\n- Career guidance",
            status: "PUBLISHED",
            registrationOpenAt: new Date("2025-01-01T00:00:00"),
            registrationCloseAt: new Date("2026-03-14T23:59:59"),
            capacity: 500,
            createdById: admin.id,
        },
    });

    console.log(`✅ Created event: ${event.title}`);

    // Link universities to event
    for (const uni of universities) {
        await prisma.eventParticipating.upsert({
            where: {
                eventId_universityId: {
                    eventId: event.id,
                    universityId: uni.id,
                },
            },
            update: {},
            create: {
                eventId: event.id,
                universityId: uni.id,
                status: "ACCEPTED",
            },
        });
    }

    console.log(`✅ Linked universities to event`);

    // Create message templates
    await prisma.messageTemplate.upsert({
        where: { name: "confirmation_email" },
        update: {},
        create: {
            name: "confirmation_email",
            channel: "EMAIL",
            subject: "Registration Confirmed: {{eventTitle}}",
            body: "Dear {{studentName}},\n\nYour registration for {{eventTitle}} is confirmed!\n\nEvent Details:\n- Date: {{eventDate}}\n- Venue: {{eventVenue}}\n\nYour QR code is attached. Present it at the venue entrance.\n\nSee you there!",
            description: "Email sent after successful registration",
            isDefault: true,
        },
    });

    await prisma.messageTemplate.upsert({
        where: { name: "confirmation_whatsapp" },
        update: {},
        create: {
            name: "confirmation_whatsapp",
            channel: "WHATSAPP",
            body: "Hi {{studentName}}! 👋\n\nYour registration for {{eventTitle}} is confirmed! ✅\n\n📅 {{eventDate}}\n📍 {{eventVenue}}\n\nYour QR code: {{qrUrl}}\n\nSee you there! 🎉",
            description: "WhatsApp confirmation message",
            isDefault: true,
        },
    });

    console.log(`✅ Created message templates`);

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📝 Login credentials:");
    console.log("   Admin Email: admin@studyinturkiye.com");
    console.log("   Admin Password: admin123");
    console.log("   Uni Portal: uni@istanbul.edu.tr");
    console.log("   Uni Password: uni123");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
