"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Types
export interface UniversityInput {
    name: string;
    logoUrl?: string;
    website?: string;
    country: string;
    city?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    programs?: string[];
    isActive?: boolean;
}

// Get all universities
export async function getUniversities(activeOnly = false) {
    return prisma.university.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        include: {
            _count: {
                select: { events: true, users: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

// Get single university with event assignments
export async function getUniversity(id: string) {
    return prisma.university.findUnique({
        where: { id },
        include: {
            events: {
                include: {
                    event: {
                        select: {
                            id: true,
                            title: true,
                            startDateTime: true,
                            status: true,
                            city: true,
                            country: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            users: {
                select: { id: true, email: true, name: true }
            }
        }
    });
}

// Create university
export async function createUniversity(data: UniversityInput) {
    const university = await prisma.university.create({
        data: {
            name: data.name,
            logoUrl: data.logoUrl,
            website: data.website,
            country: data.country || "Unknown",
            city: data.city,
            description: data.description,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            programs: data.programs || [],
            isActive: data.isActive ?? true,
        }
    });

    revalidatePath('/admin/universities');
    return university;
}

// Update university
export async function updateUniversity(id: string, data: Partial<UniversityInput>) {
    const university = await prisma.university.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
            ...(data.website !== undefined && { website: data.website }),
            ...(data.country && { country: data.country }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
            ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
            ...(data.programs !== undefined && { programs: data.programs }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        }
    });

    revalidatePath('/admin/universities');
    revalidatePath(`/admin/universities/${id}`);
    return university;
}

// Delete university
export async function deleteUniversity(id: string) {
    await prisma.university.delete({
        where: { id }
    });

    revalidatePath('/admin/universities');
}

// Assign university to event
export async function assignUniversityToEvent(
    universityId: string,
    eventId: string,
    data?: { boothNumber?: string; notes?: string }
) {
    const participation = await prisma.eventParticipating.create({
        data: {
            universityId,
            eventId,
            status: 'INVITED',
            boothNumber: data?.boothNumber,
            notes: data?.notes,
        }
    });

    revalidatePath('/admin/universities');
    revalidatePath(`/admin/universities/${universityId}`);
    revalidatePath(`/admin/events/${eventId}`);
    return participation;
}

// Remove university from event
export async function removeUniversityFromEvent(universityId: string, eventId: string) {
    await prisma.eventParticipating.delete({
        where: {
            eventId_universityId: {
                eventId,
                universityId
            }
        }
    });

    revalidatePath('/admin/universities');
    revalidatePath(`/admin/universities/${universityId}`);
    revalidatePath(`/admin/events/${eventId}`);
}

// Remove ALL universities from event
export async function removeAllUniversitiesFromEvent(eventId: string) {
    await prisma.eventParticipating.deleteMany({
        where: { eventId }
    });

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath('/admin/universities');
}

// Get available events for assignment (not already assigned to this university)
export async function getAvailableEventsForUniversity(universityId: string) {
    const assignedEventIds = await prisma.eventParticipating.findMany({
        where: { universityId },
        select: { eventId: true }
    });

    return prisma.event.findMany({
        where: {
            id: { notIn: assignedEventIds.map(e => e.eventId) },
            status: { in: ['DRAFT', 'PUBLISHED'] }
        },
        orderBy: { startDateTime: 'desc' },
        select: {
            id: true,
            title: true,
            startDateTime: true,
            city: true,
            country: true
        }
    });
}

// AI Generation Actions
export async function generateUniversityData(name: string) {
    const { generateUniversityContent } = await import("@/lib/services/openai");
    try {
        return await generateUniversityContent(name);
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("Failed to generate university content. Ensure OPENAI_API_KEY is set.");
    }
}

// University User Management
export async function getUniversityUser(universityId: string) {
    return prisma.universityUser.findFirst({
        where: { universityId },
        select: { email: true, name: true }
    });
}

export async function createOrUpdateUniversityUser(universityId: string, email: string, password?: string) {
    const { hash } = await import("bcryptjs");

    const data: any = {
        email,
        universityId,
        name: "University Representative", // Default name
    };

    if (password) {
        data.passwordHash = await hash(password, 10);
    }

    // Check if user exists for this university
    const existingUser = await prisma.universityUser.findFirst({
        where: { universityId }
    });

    if (existingUser) {
        return prisma.universityUser.update({
            where: { id: existingUser.id },
            data
        });
    } else {
        // Ensure email is unique across system if needed, but upsert handles id/unique constraints
        // We use upsert on email to be safe if checking by email
        return prisma.universityUser.upsert({
            where: { email },
            update: {
                ...data,
                universityId // Ensure linked
            },
            create: {
                ...data,
                passwordHash: data.passwordHash || "" // Should prompt for password if new
            }
        });
    }
}
