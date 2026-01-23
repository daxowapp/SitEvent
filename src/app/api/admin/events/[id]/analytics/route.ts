import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // 1. Get Event Details
        const event = await prisma.event.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                capacity: true,
                startDateTime: true,
            },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 2. Get Total Registrations & Check-ins
        // 2. Get Total Registrations & Check-ins
        const [totalRegistrations, totalCheckIns] = await Promise.all([
            prisma.registration.count({ where: { eventId: id } }),
            prisma.registration.count({ where: { eventId: id, checkIn: { isNot: null } } }),
        ]);

        // 3. Registration Timeline (Last 30 days)
        const timelineEnd = new Date();
        const timelineStart = subDays(timelineEnd, 30);

        const registrationsByDate = await prisma.registration.groupBy({
            by: ['createdAt'],
            where: {
                eventId: id,
                createdAt: { gte: timelineStart },
            },
            _count: { _all: true },
        });

        // Normalize timeline data
        const timelineMap = new Map();
        registrationsByDate.forEach(item => {
            const date = format(item.createdAt, 'yyyy-MM-dd');
            timelineMap.set(date, (timelineMap.get(date) || 0) + item._count._all);
        });

        const timeline = eachDayOfInterval({ start: timelineStart, end: timelineEnd }).map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            return {
                date: format(date, 'MMM dd'),
                count: timelineMap.get(dateStr) || 0,
            };
        });

        // 4. City & Country Distribution
        // Need to join with Registrant table
        const registrants = await prisma.registration.findMany({
            where: { eventId: id },
            select: {
                registrant: {
                    select: {
                        city: true,
                        country: true,
                        levelOfStudy: true,
                        interestedMajor: true,
                    },
                },
            },
        });

        const cityStats: Record<string, number> = {};
        const countryStats: Record<string, number> = {};
        const studyLevelStats: Record<string, number> = {};
        const majorStats: Record<string, number> = {};

        registrants.forEach(({ registrant }) => {
            // Cities
            const city = registrant.city || 'Unknown';
            cityStats[city] = (cityStats[city] || 0) + 1;

            // Countries
            const country = registrant.country || 'Unknown';
            countryStats[country] = (countryStats[country] || 0) + 1;

            // Study Levels
            const level = registrant.levelOfStudy || 'Unknown';
            studyLevelStats[level] = (studyLevelStats[level] || 0) + 1;

            // Majors
            const major = registrant.interestedMajor || 'Unknown';
            majorStats[major] = (majorStats[major] || 0) + 1;
        });

        // Helper to formatting stats for charts
        const formatStats = (stats: Record<string, number>, top: number = 5) => {
            return Object.entries(stats)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, top);
        };

        return NextResponse.json({
            event: {
                title: event.title,
                capacity: event.capacity,
                date: event.startDateTime,
            },
            stats: {
                registrations: totalRegistrations,
                checkIns: totalCheckIns,
                checkInRate: totalRegistrations > 0 ? Math.round((totalCheckIns / totalRegistrations) * 100) : 0,
                capacityFill: event.capacity ? Math.round((totalRegistrations / event.capacity) * 100) : 0,
            },
            charts: {
                timeline,
                cities: formatStats(cityStats, 5),
                countries: formatStats(countryStats, 5),
                studyLevels: formatStats(studyLevelStats),
                majors: formatStats(majorStats, 8),
            }
        });

    } catch (error) {
        console.error("Analytics API Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
