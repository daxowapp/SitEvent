"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Types
export interface CountryInput {
    name: string;
    code: string;
    flagEmoji?: string;
    timezone?: string;
}

// Get all countries
export async function getCountries() {
    return prisma.country.findMany({
        include: {
            _count: {
                select: { cities: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

// Get single country
export async function getCountry(id: string) {
    return prisma.country.findUnique({
        where: { id },
        include: {
            cities: {
                orderBy: { name: 'asc' }
            }
        }
    });
}

// Create country
export async function createCountry(data: CountryInput) {
    const country = await prisma.country.create({
        data: {
            name: data.name,
            code: data.code.toUpperCase(),
            flagEmoji: data.flagEmoji,
            timezone: data.timezone || "UTC"
        }
    });

    revalidatePath('/admin/countries');
    return country;
}

// Update country
export async function updateCountry(id: string, data: Partial<CountryInput>) {
    const country = await prisma.country.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.code && { code: data.code.toUpperCase() }),
            ...(data.flagEmoji !== undefined && { flagEmoji: data.flagEmoji }),
            ...(data.timezone && { timezone: data.timezone })
        }
    });

    revalidatePath('/admin/countries');
    return country;
}

// Delete country
export async function deleteCountry(id: string) {
    await prisma.country.delete({
        where: { id }
    });

    revalidatePath('/admin/countries');
}
