"use server";

import { prisma } from "@/lib/db";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";

export type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';

export interface AnalyticsData {
    kpis: {
        totalRegistrations: { value: number; change: number };
        totalEvents: { value: number; change: number };
        activeEvents: { value: number; change: number }; // No change metric needed really
        conversionRate: { value: number; change: number };
        totalCheckIns: { value: number; change: number };
        attendanceRate: { value: number; change: number };
    };
    charts: {
        registrationTrend: { date: string; count: number }[];
        eventsByStatus: { name: string; value: number }[];
        topMajors: { name: string; value: number }[];
        categories: { name: string; value: number }[];
        gender: { name: string; value: number }[];
        geoDistribution: { country: string; count: number }[];
        trafficSources: { name: string; value: number }[];
        eventsPerformance: { name: string; date: string; registrations: number; checkIns: number; attendanceRate: number }[];
    };
}

function getDateRange(range: DateRange) {
    const now = new Date();
    const end = endOfDay(now);
    let start = startOfDay(subDays(now, 7));
    let previousStart = startOfDay(subDays(now, 14));
    let previousEnd = endOfDay(subDays(now, 8));


    switch (range) {
        case '7d':
            start = startOfDay(subDays(now, 7));
            previousStart = startOfDay(subDays(now, 14));
            previousEnd = endOfDay(subDays(now, 8));
            break;
        case '30d':
            start = startOfDay(subDays(now, 30));
            previousStart = startOfDay(subDays(now, 60));
            previousEnd = endOfDay(subDays(now, 31));
            break;
        case '90d':
            start = startOfDay(subDays(now, 90));
            previousStart = startOfDay(subDays(now, 180));
            previousEnd = endOfDay(subDays(now, 91));
            break;
        case '1y':
            start = startOfDay(subYears(now, 1));
            previousStart = startOfDay(subYears(now, 2));
            previousEnd = endOfDay(subYears(now, 1)); // -1 day? logic is approx
            break;
        case 'all':
            start = new Date(0); // Beginning of time
            previousStart = new Date(0);
            previousEnd = new Date(0);
            break;
    }

    return { start, end, previousStart, previousEnd };
}

async function getPercentageChange(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Math.round(((current - previous) / previous) * 100);
}

export async function getAnalyticsData(range: DateRange): Promise<AnalyticsData> {
    const { start, end, previousStart, previousEnd } = getDateRange(range);

    // 1. KPI: Total Registrations
    const registrations = await prisma.registration.count({
        where: { createdAt: { gte: start, lte: end } }
    });
    const prevRegistrations = await prisma.registration.count({
        where: { createdAt: { gte: previousStart, lte: previousEnd } }
    });
    const registrationChange = await getPercentageChange(registrations, prevRegistrations);

    // 2. KPI: Total Events (Created in period)
    const events = await prisma.event.count({
        where: { createdAt: { gte: start, lte: end } }
    });
    const prevEvents = await prisma.event.count({
        where: { createdAt: { gte: previousStart, lte: previousEnd } }
    });
    const eventChange = await getPercentageChange(events, prevEvents);

    // 3. KPI: Active Events (Snapshot - currently active)
    const activeEvents = await prisma.event.count({
        where: { status: 'PUBLISHED', endDateTime: { gte: new Date() } }
    });

    // 4. KPI: Conversion Rate (Registrations / Unique Visitors... but we don't have visitors, so maybe Registrations / Events?)
    // Let's do Avg Registrations per Event
    const avgRegistrations = events > 0 ? Math.round(registrations / events) : 0;
    const prevAvgRegistrations = prevEvents > 0 ? Math.round(prevRegistrations / prevEvents) : 0;
    const conversionChange = await getPercentageChange(avgRegistrations, prevAvgRegistrations);


    // 5. Chart: Registration Trend
    // If range is 'all' or '1y', maybe group by month? For now, stick to daily for 90d, weekly for 1y?
    // Let's keep it simple: if '1y' or 'all', group by month. Else by day.
    let trendData: { date: string; count: number }[] = [];
    
    if (range === '1y' || range === 'all') {
         // Monthly grouping logic would go here, simplified to daily for now to reuse logic or just last 30 intervals
          // Actually, let's just do daily for now, recharts handles many points okay-ish.
          // Optimization: Group by month if range is large.
          const rawTrend = await prisma.registration.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: start, lte: end } },
            _count: { id: true },
          });
          // This returns discrete timestamps, we need to bucket them.
          // Fallback to fetching all and mapping in JS for flexibility
          const allRegs = await prisma.registration.findMany({
            where: { createdAt: { gte: start, lte: end } },
            select: { createdAt: true }
          });
          
          if (range === '1y') {
             // Group by month
             const months: Record<string, number> = {};
             // Initialize last 12 months
             for(let i=11; i>=0; i--) {
                const d = subMonths(new Date(), i);
                months[format(d, 'MMM yyyy')] = 0;
             }
             allRegs.forEach(r => {
                 const key = format(r.createdAt, 'MMM yyyy');
                 if (months[key] !== undefined) months[key]++;
             });
             trendData = Object.entries(months).map(([date, count]) => ({ date, count }));

          } else {
             // 'all' - maybe just last 12 months too? or by year? 
             // Let's treat 'all' like '1y' for chart purposes or max 2 years.
              const months: Record<string, number> = {};
              allRegs.forEach(r => {
                 const key = format(r.createdAt, 'MMM yyyy');
                 if (!months[key]) months[key] = 0;
                 months[key]++;
             });
             trendData = Object.entries(months).map(([date, count]) => ({ date, count }));
          }

    } else {
        // Daily
        const daysInterval = eachDayOfInterval({ start, end: new Date() }); // up to now
        const allRegs = await prisma.registration.findMany({
            where: { createdAt: { gte: start, lte: end } },
            select: { createdAt: true }
        });
        
        trendData = daysInterval.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const count = allRegs.filter(r => format(r.createdAt, "yyyy-MM-dd") === dayStr).length;
            return { date: format(day, "MMM dd"), count };
        });
    }

    // 6. Chart: Events by Status
    const statusCounts = await prisma.event.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { status: true },
    });

    // 7. Chart: Top Major Interests
    const topMajors = await prisma.registrant.groupBy({
        by: ['standardizedMajor'],
        where: { 
            standardizedMajor: { not: null },
            registrations: { some: { createdAt: { gte: start, lte: end } } } // Filter by registration date
        },
        _count: { standardizedMajor: true },
        orderBy: { _count: { standardizedMajor: 'desc' } },
        take: 8
    });

     // 8. Chart: Categories
    const categories = await prisma.registrant.groupBy({
        by: ['majorCategory'],
        where: { 
             majorCategory: { not: null },
             registrations: { some: { createdAt: { gte: start, lte: end } } }
        },
        _count: { majorCategory: true },
        orderBy: { _count: { majorCategory: 'desc' } }
    });

    // 9. Chart: Gender
    const gender = await prisma.registrant.groupBy({
        by: ['gender'],
        where: { 
             gender: { not: null },
             registrations: { some: { createdAt: { gte: start, lte: end } } } // Filter by registration date?
             // Technical note: Registrant creation date might differ from Registration date. 
             // But usually they are created together. Let's use Registration relation for accuracy in period.
        },
        _count: { gender: true },
    });

    // 10. Geo Distribution
    const geoRaw = await prisma.registrant.groupBy({
        by: ['country'],
        where: {
            registrations: { some: { createdAt: { gte: start, lte: end } } }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
    });

    // 11. KPI: Total Check-ins
    const checkIns = await prisma.checkIn.count({
        where: { checkedInAt: { gte: start, lte: end } }
    });
    const prevCheckIns = await prisma.checkIn.count({
        where: { checkedInAt: { gte: previousStart, lte: previousEnd } }
    });
    const checkInChange = await getPercentageChange(checkIns, prevCheckIns);

    // 12. Overall Attendance Rate (Check-ins / Registrations in period)
    const attendanceRate = registrations > 0 ? Math.round((checkIns / registrations) * 100) : 0;
    const prevAttendanceRate = prevRegistrations > 0 ? Math.round((prevCheckIns / prevRegistrations) * 100) : 0;
    const attendanceChange = await getPercentageChange(attendanceRate, prevAttendanceRate);


    // 13. Event Performance (Top 5 by registrations in period)
    const topEvents = await prisma.event.findMany({
        select: {
            title: true,
            startDateTime: true,
            _count: {
                select: {
                    registrations: { where: { createdAt: { gte: start, lte: end } } } 
                }
            },
            registrations: {
                where: { createdAt: { gte: start, lte: end } },
                select: {
                    checkIn: { select: { id: true } }
                }
            }
        },
        where: {
            registrations: { some: { createdAt: { gte: start, lte: end } } }
        },
        orderBy: {
            registrations: {
                _count: 'desc'
            }
        },
        take: 5
    });

    const eventsPerformance = topEvents.map(e => ({
        name: e.title,
        date: format(e.startDateTime, 'MMM dd, yyyy'),
        registrations: e._count.registrations,
        checkIns: e.registrations.filter(r => r.checkIn).length,
        attendanceRate: e._count.registrations > 0 
            ? Math.round((e.registrations.filter(r => r.checkIn).length / e._count.registrations) * 100) 
            : 0
    }));


    // 14. Traffic Sources
    const sources = await prisma.registrant.groupBy({
        by: ['utmSource'],
        where: { 
             utmSource: { not: null },
             registrations: { some: { createdAt: { gte: start, lte: end } } }
        },
        _count: { utmSource: true },
        orderBy: { _count: { utmSource: 'desc' } },
        take: 6
    });


    return {
        kpis: {
            totalRegistrations: { value: registrations, change: registrationChange },
            totalEvents: { value: events, change: eventChange },
            activeEvents: { value: activeEvents, change: 0 },
            conversionRate: { value: avgRegistrations, change: conversionChange }, // Kept as avg regs
            totalCheckIns: { value: checkIns, change: checkInChange },
            attendanceRate: { value: attendanceRate, change: attendanceChange }
        },
        charts: {
            registrationTrend: trendData,
            eventsByStatus: statusCounts.map(s => ({ name: s.status, value: s._count.status })),
            topMajors: topMajors.map(m => ({ name: m.standardizedMajor || "Unknown", value: m._count.standardizedMajor })),
            categories: categories.map(c => ({ name: c.majorCategory || "Unknown", value: c._count.majorCategory })),
            gender: gender.map(g => ({ name: g.gender || "Unknown", value: g._count.gender })),
            geoDistribution: geoRaw.map(g => ({ country: g.country || "Unknown", count: g._count.id })),
            trafficSources: sources.map(s => ({ name: s.utmSource || "Direct/Unknown", value: s._count.utmSource })),
            eventsPerformance
        }
    };
}
