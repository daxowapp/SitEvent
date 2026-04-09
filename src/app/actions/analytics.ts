"use server";

import { prisma } from "@/lib/db";
import { requireManagerOrAbove } from "@/lib/role-check";

export interface RealtimeAnalyticsData {
    totalRegistrations: number;
    checkInCount: number;
}

export async function getRealtimeAnalytics(eventId: string): Promise<RealtimeAnalyticsData> {
    await requireManagerOrAbove();

    const [totalRegistrations, checkInCount] = await Promise.all([
        prisma.registration.count({
            where: { eventId }
        }),
        prisma.registration.count({
            where: {
                eventId,
                checkIn: { isNot: null }
            }
        })
    ]);

    return {
        totalRegistrations,
        checkInCount
    };
}
