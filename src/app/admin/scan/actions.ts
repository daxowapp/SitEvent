"use server";

import { prisma } from "@/lib/db";
import { requireActionAdmin } from "@/lib/role-check";

export async function getLiveStats(eventId: string) {
    await requireActionAdmin();
    if (!eventId) return { checkInCount: 0 };

    try {
        const count = await prisma.registration.count({
            where: {
                eventId,
                checkIn: {
                    isNot: null,
                },
            },
        });
        return { checkInCount: count };
    } catch (error) {
        console.error("Failed to fetch live stats", error);
        return { checkInCount: 0 };
    }
}
