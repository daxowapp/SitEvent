"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendUniversityAccessRequestEmail } from "@/lib/email";

export async function requestEventAccess(eventId: string) {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        return { success: false, error: "Unauthorized" };
    }



    try {
        const existingParticipation = await prisma.eventParticipating.findUnique({
            where: {
                eventId_universityId: {
                    eventId,
                    universityId: session.user.universityId
                }
            }
        });

        if (existingParticipation?.status === "ACCEPTED") {
             return { success: false, error: "You are already participating in this event." };
        }

        const participation = await prisma.eventParticipating.upsert({
            where: {
                eventId_universityId: {
                    eventId,
                    universityId: session.user.universityId
                }
            },
            update: {
                status: "REQUESTED"
            },
            create: {
                eventId,
                universityId: session.user.universityId,
                status: "REQUESTED"
            },
            include: {
                event: { select: { title: true } },
                university: { select: { name: true } }
            }
        });

        // Send notification email to admins
        await sendUniversityAccessRequestEmail(
            participation.university.name,
            eventId,
            participation.event.title
        );

        revalidatePath(`/university/events/${eventId}`);
        revalidatePath(`/university/dashboard`);
        return { success: true };
    } catch (error) {
        console.error("Failed to request event access:", error);
        return { success: false, error: "Failed to process request. You might already be registered." };
    }
}
