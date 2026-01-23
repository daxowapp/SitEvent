"use server";

import { prisma } from "@/lib/db";
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
        });

        if (!existingEvent) {
            throw new Error("Event not found");
        }

        // Destructure to remove system fields
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, slug, title, status, ...eventData } = existingEvent;

        const newTitle = `${title} (Copy)`;
        const newSlug = `${slug}-copy-${Date.now()}`;

        const newEvent = await prisma.event.create({
            data: {
                ...eventData,
                title: newTitle,
                slug: newSlug,
                status: "DRAFT",
                createdById: session.user.id, // Assign to current user
            },
        });

        revalidatePath("/admin/events");
        return { success: true, eventId: newEvent.id };
    } catch (error) {
        console.error("Failed to duplicate event:", error);
        return { success: false, error: "Failed to duplicate event" };
    }
}
