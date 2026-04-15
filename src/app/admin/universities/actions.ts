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
export async function getAllUniversityUsers(universityId: string) {
    return prisma.universityUser.findMany({
        where: { universityId },
        select: { id: true, email: true, name: true, role: true },
        orderBy: { createdAt: 'asc' }
    });
}

export async function createOrUpdateUniversityUser(universityId: string, email: string, role: string, password?: string, userId?: string) {
    const { hash } = await import("bcryptjs");

    const data: any = {
        email,
        universityId,
        role,
    };

    if (password) {
        data.passwordHash = await hash(password, 10);
    }

    // If we have an explicit ID to update
    if (userId) {
        const updated = await prisma.universityUser.update({
            where: { id: userId },
            data
        });
        revalidatePath(`/admin/universities/${universityId}`);
        return updated;
    }

    // If no explicit ID, see if we are updating by email organically
    const existingEmailMatch = await prisma.universityUser.findFirst({
        where: { email }
    });

    if (existingEmailMatch) {
        throw new Error("A user with this email already exists.");
    }

    // Create a brand new user
    // We provide a default name that they can change later
    const created = await prisma.universityUser.create({
        data: {
            ...data,
            name: role === "ADMIN" ? "University Admin" : "Event Staff",
            passwordHash: data.passwordHash || "" 
        }
    });

    revalidatePath(`/admin/universities/${universityId}`);
    return created;
}

export async function deleteUniversityUser(userId: string, universityId: string) {
    await prisma.universityUser.delete({
        where: { id: userId }
    });
    revalidatePath(`/admin/universities/${universityId}`);
}

