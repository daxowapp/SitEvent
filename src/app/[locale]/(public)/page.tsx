import { setRequestLocale } from 'next-intl/server';
import Hero from "@/components/sections/Hero";
import EventsSection from "@/components/sections/EventsSection";
import HowItWorks from "@/components/sections/HowItWorks";
import StatsSection from "@/components/sections/StatsSection";
import UniversitiesSection from "@/components/sections/UniversitiesSection";
import { Prisma } from '@prisma/client';

// Type for event display
interface DisplayEvent {
    id: string;
    title: string;
    slug: string;
    country: string | null;
    city: string | null;
    venueName: string | null;
    bannerImageUrl: string | null;
    startDateTime: Date;
    status: string;
}

async function getUpcomingEvents(searchQuery?: string): Promise<DisplayEvent[]> {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[project-ref]')) {
        return [];
    }

    try {
        const { prisma } = await import("@/lib/db");

        const where: Prisma.EventWhereInput = {
            status: "PUBLISHED",
            startDateTime: { gte: new Date() },
        };

        if (searchQuery) {
            where.OR = [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { city: { contains: searchQuery, mode: 'insensitive' } },
                { country: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: { startDateTime: "asc" },
            take: 6,
        });

        return events;
    } catch (error) {
        console.warn("Database unavailable");
        return [];
    }
}

async function getPastEvents(): Promise<DisplayEvent[]> {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[project-ref]')) {
        return [];
    }

    try {
        const { prisma } = await import("@/lib/db");
        const events = await prisma.event.findMany({
            where: {
                status: "PUBLISHED",
                startDateTime: { lt: new Date() },
            },
            orderBy: { startDateTime: "desc" },
            take: 3,
        });
        return events;
    } catch {
        return [];
    }
}

async function getEventStats() {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[project-ref]')) {
        return { countryCount: 5, countryList: ["Türkiye", "Germany", "UK"], universities: [] };
    }

    try {
        const { prisma } = await import("@/lib/db");

        // Parallel queries
        const [countries, topUniversities] = await Promise.all([
            prisma.event.findMany({
                where: { status: "PUBLISHED" },
                select: { country: true },
                distinct: ['country'],
            }),
            prisma.university.findMany({
                take: 6,
                select: { id: true, name: true, logoUrl: true },
                orderBy: { name: 'asc' } // Or random/popularity if available
            })
        ]);

        const countryList = countries
            .map(c => c.country)
            .filter((c): c is string => c !== null);

        return {
            countryCount: countryList.length || 5,
            countryList: countryList.length > 0 ? countryList : ["Türkiye", "Germany", "UK", "Netherlands", "USA"],
            universities: topUniversities
        };
    } catch (error) {
        return { countryCount: 5, countryList: ["Türkiye", "Germany", "UK"], universities: [] };
    }
}

export default async function HomePage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const q = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;

    setRequestLocale(locale);

    const [upcomingEvents, pastEvents, stats] = await Promise.all([
        getUpcomingEvents(q),
        getPastEvents(),
        getEventStats(),
    ]);

    return (
        <div className="min-h-screen bg-background">
            <main>
                <Hero initialQuery={q} popularSearchTerms={stats.countryList} />
                <EventsSection upcomingEvents={upcomingEvents} pastEvents={pastEvents} />
                <HowItWorks />
                <StatsSection countryCount={stats.countryCount} countryList={stats.countryList} />
                <UniversitiesSection universities={stats.universities} />
            </main>
        </div>
    );
}
