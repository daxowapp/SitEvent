"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Types for city content
export interface Attraction {
    name: string;
    description?: string;
    imageUrl?: string;
    mapUrl?: string;
}

export interface CafeOrFood {
    name: string;
    cuisine?: string;
    priceRange?: string;
    address?: string;
    mapUrl?: string;
}

export interface Transportation {
    airport?: string;
    metro?: string;
    taxi?: string;
    tips?: string;
}

export interface CityInput {
    name: string;
    countryId: string;
    description?: string;
    bannerImageUrl?: string;
    attractions?: Attraction[];
    cafesAndFood?: CafeOrFood[];
    transportation?: Transportation;
    localTips?: string;
    emergencyInfo?: string;
}

// Get all cities (optionally filtered by country)
export async function getCities(countryId?: string) {
    return prisma.city.findMany({
        where: countryId ? { countryId } : undefined,
        include: {
            country: true,
            _count: {
                select: { events: true }
            }
        },
        orderBy: [
            { country: { name: 'asc' } },
            { name: 'asc' }
        ]
    });
}

// Get single city with full details
export async function getCity(id: string) {
    return prisma.city.findUnique({
        where: { id },
        include: {
            country: true,
            events: {
                take: 5,
                orderBy: { startDateTime: 'desc' },
                select: { id: true, title: true, startDateTime: true }
            }
        }
    });
}

// Create city
export async function createCity(data: CityInput) {
    const city = await prisma.city.create({
        data: {
            name: data.name,
            countryId: data.countryId,
            description: data.description,
            bannerImageUrl: data.bannerImageUrl,
            attractions: data.attractions || [],
            cafesAndFood: data.cafesAndFood || [],
            transportation: data.transportation || {},
            localTips: data.localTips,
            emergencyInfo: data.emergencyInfo,
        }
    });

    revalidatePath('/admin/cities');
    return city;
}

// Update city
export async function updateCity(id: string, data: Partial<CityInput>) {
    const city = await prisma.city.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.countryId && { countryId: data.countryId }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.bannerImageUrl !== undefined && { bannerImageUrl: data.bannerImageUrl }),
            ...(data.attractions !== undefined && { attractions: data.attractions }),
            ...(data.cafesAndFood !== undefined && { cafesAndFood: data.cafesAndFood }),
            ...(data.transportation !== undefined && { transportation: data.transportation }),
            ...(data.localTips !== undefined && { localTips: data.localTips }),
            ...(data.emergencyInfo !== undefined && { emergencyInfo: data.emergencyInfo }),
        }
    });

    revalidatePath('/admin/cities');
    revalidatePath(`/admin/cities/${id}`);
    return city;
}

// Delete city
export async function deleteCity(id: string) {
    await prisma.city.delete({
        where: { id }
    });

    revalidatePath('/admin/cities');
}
