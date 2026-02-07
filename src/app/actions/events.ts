"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function duplicateEvent(eventId: string) {
    const session = await auth();
    const allowedRoles = ["SUPER_ADMIN", "EVENT_MANAGER", "EVENT_STAFF"];
    if (!session?.user || !allowedRoles.includes(session.user.role as string)) {
        throw new Error("Unauthorized");
    }

    try {
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            include: { sessions: true },
        });

        if (!existingEvent) {
            throw new Error("Event not found");
        }

        // Destructure to remove system fields
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, slug, title, status, sessions, ...eventData } = existingEvent;

        const newTitle = `${title} (Copy)`;
        const newSlug = `${slug}-copy-${Date.now()}`;

        const newEvent = await prisma.event.create({
            data: {
                ...eventData,
                title: newTitle,
                slug: newSlug,
                status: "DRAFT",
                createdById: session.user.id,
                titleTranslations: eventData.titleTranslations ?? Prisma.JsonNull,
                descriptionTranslations: eventData.descriptionTranslations ?? Prisma.JsonNull,
                sessions: {
                    create: sessions.map(session => ({
                        title: session.title,
                        description: session.description,
                        startTime: session.startTime,
                        endTime: session.endTime,
                        location: session.location,
                        speaker: session.speaker,
                        order: session.order,
                    })),
                },
            },
        });

        revalidatePath("/admin/events");
        return { success: true, eventId: newEvent.id };
    } catch (error) {
        console.error("Failed to duplicate event:", error);
        return { success: false, error: "Failed to duplicate event" };
    }
}

export async function duplicateSession(sessionId: string, eventId: string) {
    const session = await auth();
    const allowedRoles = ["SUPER_ADMIN", "EVENT_MANAGER", "EVENT_STAFF"];
    if (!session?.user || !allowedRoles.includes(session.user?.role as string)) {
        throw new Error("Unauthorized");
    }

    try {
        const existingSession = await prisma.eventSession.findUnique({
            where: { id: sessionId },
        });

        if (!existingSession) {
            throw new Error("Session not found");
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...sessionData } = existingSession;

        const newSession = await prisma.eventSession.create({
            data: {
                ...sessionData,
                title: `${sessionData.title} (Copy)`,
                eventId: eventId, // Ensure it belongs to the same event
            },
        });

        revalidatePath(`/admin/events/${eventId}`);
        return { success: true, session: newSession };
    } catch (error) {
        console.error("Failed to duplicate session:", error);
        return { success: false, error: "Failed to duplicate session" };
    }
}
