import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface EventsPageProps {
    searchParams: Promise<{
        country?: string;
        city?: string;
        search?: string;
    }>;
}

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

// Mock data when database is not available
const MOCK_EVENTS: DisplayEvent[] = [
    {
        id: "1",
        title: "Education Fair Istanbul 2026",
        slug: "education-fair-istanbul-2026",
        country: "Turkey",
        city: "Istanbul",
        venueName: "Istanbul Congress Center",
        bannerImageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
        startDateTime: new Date("2026-03-15T10:00:00"),
        status: "PUBLISHED",
    },
    {
        id: "2",
        title: "Study Abroad Expo Dubai 2026",
        slug: "study-abroad-expo-dubai-2026",
        country: "UAE",
        city: "Dubai",
        venueName: "Dubai World Trade Centre",
        bannerImageUrl: "https://images.unsplash.com/photo-1512453979798-5ea932a23518?w=800&q=80",
        startDateTime: new Date("2026-04-20T09:00:00"),
        status: "PUBLISHED",
    },
    {
        id: "3",
        title: "University Fair Riyadh 2026",
        slug: "university-fair-riyadh-2026",
        country: "Saudi Arabia",
        city: "Riyadh",
        venueName: "Riyadh International Convention Center",
        bannerImageUrl: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80",
        startDateTime: new Date("2026-05-10T10:00:00"),
        status: "PUBLISHED",
    },
    {
        id: "4",
        title: "Global Tech Education Summit London",
        slug: "global-tech-education-london",
        country: "UK",
        city: "London",
        venueName: "ExCeL London",
        bannerImageUrl: "https://images.unsplash.com/photo-1526304640152-d4619684e484?w=800&q=80",
        startDateTime: new Date("2026-06-15T09:00:00"),
        status: "PUBLISHED",
    },
];

function isDatabaseConfigured(): boolean {
    return !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[project-ref]'));
}

async function getEvents(): Promise<DisplayEvent[]> {
    if (!isDatabaseConfigured()) {
        console.log("Database not configured, using mock data");
        return MOCK_EVENTS;
    }

    try {
        const { prisma } = await import("@/lib/db");
        return await prisma.event.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { startDateTime: "asc" },
        });
    } catch (error) {
        console.error("Database error, using mock data:", error);
        return MOCK_EVENTS;
    }
}

async function getFilterOptions(): Promise<{ countries: string[]; cities: string[] }> {
    if (!isDatabaseConfigured()) {
        const countries = Array.from(new Set(MOCK_EVENTS.map((e) => e.country).filter((c): c is string => !!c))).sort();
        const cities = Array.from(new Set(MOCK_EVENTS.map((e) => e.city).filter((c): c is string => !!c))).sort();
        return { countries, cities };
    }

    try {
        const { prisma } = await import("@/lib/db");
        const events = await prisma.event.findMany({
            where: { status: "PUBLISHED" },
            select: { country: true, city: true },
            distinct: ["country", "city"],
        });

        const countries = Array.from(new Set(events.map(e => e.country).filter((c): c is string => !!c))).sort();
        const cities = Array.from(new Set(events.map(e => e.city).filter((c): c is string => !!c))).sort();

        return { countries, cities };
    } catch {
        const countries = Array.from(new Set(MOCK_EVENTS.map((e) => e.country).filter((c): c is string => !!c))).sort();
        const cities = Array.from(new Set(MOCK_EVENTS.map((e) => e.city).filter((c): c is string => !!c))).sort();
        return { countries, cities };
    }
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
    const params = await searchParams;
    const [allEvents, filterOptions] = await Promise.all([
        getEvents(),
        getFilterOptions(),
    ]);

    // Apply filters
    let events = allEvents;
    if (params.country) {
        events = events.filter(e => (e.country || "").toLowerCase().includes(params.country!.toLowerCase()));
    }
    if (params.city) {
        events = events.filter(e => (e.city || "").toLowerCase().includes(params.city!.toLowerCase()));
    }
    if (params.search) {
        events = events.filter(e =>
            e.title.toLowerCase().includes(params.search!.toLowerCase())
        );
    }

    const now = new Date();
    const upcomingEvents = events.filter((e) => new Date(e.startDateTime) >= now);
    const pastEvents = events.filter((e) => new Date(e.startDateTime) < now);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-24 md:py-32 border-b border-gray-100 bg-gray-50">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-3 mb-6">
                            <span className="w-12 h-1 bg-[hsl(var(--turkish-red))]" />
                            <span className="text-sm tracking-widest uppercase text-[hsl(var(--turkish-red))] font-bold">
                                Browse
                            </span>
                        </div>
                        <h1 className="display-text text-5xl md:text-6xl text-gray-900 mb-6 font-bold">
                            Education Events
                        </h1>
                        <p className="text-lg text-gray-500 leading-relaxed">
                            Discover education fairs and university expos happening around the world.
                            Connect with top universities and take the first step towards your future.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section className="py-8 border-b border-gray-100 bg-white sticky top-20 z-40 shadow-sm">
                <div className="container mx-auto px-6 md:px-12">
                    <form className="flex flex-wrap gap-4 items-center">
                        <Input
                            type="search"
                            name="search"
                            placeholder="Search events..."
                            defaultValue={params.search}
                            className="w-full sm:w-64 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-lg focus:border-[hsl(var(--turkish-red))] focus:ring-[hsl(var(--turkish-red))]"
                        />
                        <select
                            name="country"
                            defaultValue={params.country}
                            className="h-10 bg-gray-50 border border-gray-200 text-gray-700 px-4 text-sm rounded-lg focus:border-[hsl(var(--turkish-red))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--turkish-red))]"
                        >
                            <option value="">All Countries</option>
                            {filterOptions.countries.map((country: string) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                        <select
                            name="city"
                            defaultValue={params.city}
                            className="h-10 bg-gray-50 border border-gray-200 text-gray-700 px-4 text-sm rounded-lg focus:border-[hsl(var(--turkish-red))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--turkish-red))]"
                        >
                            <option value="">All Cities</option>
                            {filterOptions.cities.map((city: string) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                        <Button
                            type="submit"
                            className="bg-[hsl(var(--turkish-red))] text-white hover:bg-[hsl(356,91%,40%)] rounded-lg px-6 text-xs tracking-widest uppercase font-semibold"
                        >
                            Filter
                        </Button>
                        {(params.search || params.country || params.city) && (
                            <Button
                                variant="ghost"
                                asChild
                                className="text-gray-500 hover:text-[hsl(var(--turkish-red))] hover:bg-transparent"
                            >
                                <Link href="/events">Clear Filters</Link>
                            </Button>
                        )}
                    </form>
                </div>
            </section>

            {/* Events List */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-6 md:px-12">
                    {/* Upcoming Events */}
                    <div className="mb-20">
                        <div className="flex items-center gap-4 mb-10">
                            <h2 className="display-text text-3xl text-gray-800 font-bold">
                                Upcoming Events
                            </h2>
                            <span className="px-3 py-1 bg-red-50 text-[hsl(var(--turkish-red))] rounded-full text-xs tracking-wide font-bold">
                                {upcomingEvents.length}
                            </span>
                        </div>

                        {upcomingEvents.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                                <p className="text-gray-500">No upcoming events found matching your criteria</p>
                            </div>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {upcomingEvents.map((event) => (
                                    <EventCard key={event.id} event={event} isUpcoming />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Events */}
                    {pastEvents.length > 0 && (
                        <div>
                            <div className="flex items-center gap-4 mb-10">
                                <h2 className="display-text text-3xl text-gray-400 font-bold">
                                    Past Events
                                </h2>
                                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs tracking-wide font-bold">
                                    {pastEvents.length}
                                </span>
                            </div>
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {pastEvents.map((event) => (
                                    <EventCard key={event.id} event={event} isUpcoming={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function EventCard({
    event,
    isUpcoming,
}: {
    event: DisplayEvent;
    isUpcoming: boolean;
}) {
    return (
        <Link
            href={`/events/${event.slug}`}
            className={`group block ${!isUpcoming ? "opacity-60 grayscale hover:grayscale-0 transition-all" : ""}`}
        >
            <article className="bg-white border border-gray-100 rounded-xl card-hover overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md">
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    {event.bannerImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={event.bannerImageUrl}
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <span className="text-5xl opacity-20">🎓</span>
                        </div>
                    )}
                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-md shadow-sm">
                        <p className="text-xs tracking-widest uppercase text-[hsl(var(--turkish-red))] font-bold">
                            {format(new Date(event.startDateTime), "MMM d, yyyy")}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <h3 className="display-text text-xl text-gray-900 line-clamp-2 group-hover:text-[hsl(var(--turkish-red))] transition-colors font-bold">
                        {event.title}
                    </h3>
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="text-[hsl(var(--turkish-red))]">📍</span>
                            <span>{event.city || 'TBA'}, {event.country || 'TBA'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="text-[hsl(var(--turkish-red))]">🏛️</span>
                            <span className="line-clamp-1">{event.venueName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="text-[hsl(var(--turkish-red))]">🕐</span>
                            <span>{format(new Date(event.startDateTime), "h:mm a")}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-auto">
                        <span className="text-xs tracking-widest uppercase text-[hsl(var(--turkish-red))] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                            {isUpcoming ? "Register Now" : "View Details"} <span>→</span>
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
