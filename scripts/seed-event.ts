
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEvent() {
  try {

    // 0. Find or create an admin user
    const adminUser = await prisma.adminUser.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            passwordHash: 'hashedpassword123', // In a real app, hash this properly
            name: 'Admin User',
            role: 'SUPER_ADMIN',
        },
    });

    // 1. Create a country and city if they don't exist
    const country = await prisma.country.upsert({
      where: { code: 'TR' },
      update: {},
      create: {
        name: 'Turkey',
        code: 'TR',
        flagEmoji: '🇹🇷',
      },
    });

    const city = await prisma.city.upsert({
      where: { countryId_name: { countryId: country.id, name: 'Istanbul' } },
      update: {},
      create: {
        name: 'Istanbul',
        countryId: country.id,
      },
    });

    // 2. Create the event
    const event = await prisma.event.create({
      data: {
        title: 'Kiosk Mode Test Event',
        slug: 'kiosk-test-event-' + Date.now(), // Ensure uniqueness
        startDateTime: new Date(Date.now() + 86400000), // Tomorrow
        endDateTime: new Date(Date.now() + 172800000), // Day after tomorrow
        description: 'This is a test event for the kiosk mode.',
        cityId: city.id,
        bannerImageUrl: 'https://placehold.co/600x400',
        venueName: 'Test Venue',
        venueAddress: '123 Test St, Istanbul',
        capacity: 100,
        status: 'PUBLISHED',
        createdById: adminUser.id,
      },
    });

    console.log('--- Created Test Event ---');
    console.log(`Title: ${event.title}`);
    console.log(`Slug: ${event.slug}`);
    console.log(`ID: ${event.id}`);
    console.log('--------------------------');
  } catch (error) {
    console.error('Error seeding event:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEvent();
