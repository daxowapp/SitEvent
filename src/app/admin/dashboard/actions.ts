"use server";

import { prisma } from "@/lib/db";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";

export interface RegistrationTrend {
    date: string;
    count: number;
}

export interface EventStatusDistribution {
    status: string;
    count: number;
}

export async function getDashboardData() {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    // 1. Chart: Registration Trend (Last 30 Days)
    const registrations = await prisma.registration.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
    });

    // Fill in dates with 0 if no registrations
    const daysInterval = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    const trendData: RegistrationTrend[] = daysInterval.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = registrations.filter(r =>
            format(r.createdAt, "yyyy-MM-dd") === dayStr
        ).length;
        return { date: format(day, "MMM dd"), count };
    });

    // 2. Chart: Event Status Distribution
    const statusCounts = await prisma.event.groupBy({
        by: ['status'],
        _count: { status: true },
    });

    // 3. Stats: Key Metrics
    const totalRevenue = 0; // Placeholder if we had payments
    const totalRegistrations = await prisma.registration.count();
    const totalEvents = await prisma.event.count();
    const activeEvents = await prisma.event.count({
        where: { endDateTime: { gte: now }, status: "PUBLISHED" }
    });

    // 4. Recent Activity
    const recentActivity = await prisma.registration.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            registrant: { select: { fullName: true, email: true } },
            event: { select: { title: true } }
        }
    });

    // 5. Action Feed Metrics
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const registrationsLastHour = await prisma.registration.count({
        where: { createdAt: { gte: oneHourAgo } }
    });

    const pendingUniversityRequests = await prisma.eventParticipating.count({
        where: { status: 'REQUESTED' }
    });

    // 6. Geo Distribution
    const geoRaw = await prisma.registrant.groupBy({
        by: ['country'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 100,
    });

    const geoData = geoRaw.map(g => ({
        country: g.country || "Unknown",
        count: g._count.id
    }));

    const formattedRecentActivity = recentActivity.map(r => ({
        id: r.id,
        type: 'REGISTRATION',
        user: {
            name: r.registrant.fullName,
            email: r.registrant.email
        },
        event: {
            title: r.event.title
        },
        createdAt: r.createdAt
    }));

    // 7. AI Groups
    // Top Majors
    const topMajors = await prisma.registrant.groupBy({
        by: ['standardizedMajor'],
        _count: { standardizedMajor: true },
        where: { standardizedMajor: { not: null } },
        orderBy: { _count: { standardizedMajor: 'desc' } },
        take: 5
    });

    // Category Distribution
    const majorCategories = await prisma.registrant.groupBy({
        by: ['majorCategory'],
        _count: { majorCategory: true },
        where: { majorCategory: { not: null } },
        orderBy: { _count: { majorCategory: 'desc' } }
    });

    // Gender Distribution
    const genderDist = await prisma.registrant.groupBy({
        by: ['gender'],
        _count: { gender: true },
        where: { gender: { not: null } }
    });

    return {
        trendData,
        statusCounts: statusCounts.map(s => ({ name: s.status, value: s._count.status })),
        stats: {
            totalRegistrations,
            totalEvents,
            activeEvents,
            conversionRate: 0
        },
        recentActivity: formattedRecentActivity,
        actionOverview: {
            registrationsLastHour,
            pendingApprovals: pendingUniversityRequests,
        },
        geoData,
        aiStats: {
            topMajors: topMajors.map(m => ({ name: m.standardizedMajor || "Unknown", value: m._count.standardizedMajor })),
            categories: majorCategories.map(c => ({ name: c.majorCategory || "Unknown", value: c._count.majorCategory })),
            gender: genderDist.map(g => ({ name: g.gender || "Unknown", value: g._count.gender }))
        }
    };
}
