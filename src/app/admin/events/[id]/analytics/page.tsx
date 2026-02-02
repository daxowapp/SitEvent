import { prisma } from "@/lib/db";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { requireManagerOrAbove } from "@/lib/role-check";

export const metadata: Metadata = {
    title: "Analytics",
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EventAnalyticsPage({ params }: PageProps) {
    await requireManagerOrAbove();
    const { id } = await params;

    // Check if event exists
    const event = await prisma.event.findUnique({
        where: { id },
        select: { id: true, title: true, startDateTime: true }
    });

    if (!event) {
        notFound();
    }

    // 1. Fetch KPI Data
    const totalRegistrations = await prisma.registration.count({
        where: { eventId: id }
    });

    const checkInCount = await prisma.registration.count({
        where: {
            eventId: id,
            checkIn: { isNot: null }
        }
    });

    // 2. Fetch Growth Data (Daily Registrations)
    // Note: Prisma doesn't support advanced time-series grouping natively easily across all DBs without raw query.
    // For simplicity/compatibility, we can fetch createdAt dates and aggregate in JS for now (efficient enough for <10k records).
    // If scaling, use `prisma.$queryRaw`.
    const registrations = await prisma.registration.findMany({
        where: { eventId: id },
        select: { createdAt: true }
    });

    // Aggregate by Date (YYYY-MM-DD)
    const dailyMap = new Map<string, number>();
    registrations.forEach(reg => {
        const dateStr = format(reg.createdAt, "yyyy-MM-dd");
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
    });

    // Convert map to sorted array
    const dailyGrowth = Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));


    // 3. Fetch Top Sources
    const sourceGroups = await prisma.registrant.groupBy({
        by: ['utmSource'],
        where: {
            registrations: {
                some: { eventId: id }
            },
            utmSource: { not: null }
        },
        _count: {
            utmSource: true
        },
        orderBy: {
            _count: {
                utmSource: 'desc'
            }
        },
        take: 6
    });

    const sources = sourceGroups.map(g => ({
        name: g.utmSource || "Direct",
        value: g._count.utmSource
    }));

    // Find top source
    const topSource = sources.length > 0 ? sources[0].name : "None";

    // 4. Fetch AI Enrichment Data
    // Gender Distribution
    const genderGroups = await prisma.registrant.groupBy({
        by: ['gender'],
        where: {
            registrations: { some: { eventId: id } }
        },
        _count: { gender: true }
    });
    const genders = genderGroups.map(g => ({
        name: g.gender || "Unknown",
        count: g._count.gender
    }));

    // Top Majors (Standardized)
    const majorGroups = await prisma.registrant.groupBy({
        by: ['standardizedMajor'],
        where: {
            registrations: { some: { eventId: id } },
            standardizedMajor: { not: null }
        },
        _count: { standardizedMajor: true },
        orderBy: { _count: { standardizedMajor: 'desc' } },
        take: 5
    });
    const topMajors = majorGroups.map(g => ({
        name: g.standardizedMajor || "Unknown",
        count: g._count.standardizedMajor
    }));

    // Interest Categories
    const categoryGroups = await prisma.registrant.groupBy({
        by: ['majorCategory'],
        where: {
            registrations: { some: { eventId: id } },
            majorCategory: { not: null }
        },
        _count: { majorCategory: true },
        orderBy: { _count: { majorCategory: 'desc' } },
        take: 6
    });
    const categories = categoryGroups.map(g => ({
        name: g.majorCategory || "Uncategorized",
        count: g._count.majorCategory
    }));

    const analyticsData = {
        totalRegistrations,
        checkInCount,
        dailyGrowth,
        sources,
        topSource,
        genders,
        topMajors,
        categories
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Analytics: {event.title}</h1>
                    <p className="text-muted-foreground">
                        Performance overview for {format(event.startDateTime, "MMMM d, yyyy")}
                    </p>
                </div>
            </div>

            <AnalyticsDashboard data={analyticsData} />
        </div>
    );
}
