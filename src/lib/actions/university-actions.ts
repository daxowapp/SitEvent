"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function requestJoinEvent(eventId: string) {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.eventParticipating.create({
            data: {
                eventId,
                universityId: session.user.universityId,
                status: "REQUESTED",
            },
        });

        revalidatePath("/university/explore");
        return { success: true };
    } catch (error) {
        console.error("Failed to request join:", error);
        return { success: false, error: "Database error" };
    }
}
