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
    country: string;
    city: string;
    venueName: string;
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
        const countries = Array.from(new Set(MOCK_EVENTS.map((e) => e.country))).sort();
        const cities = Array.from(new Set(MOCK_EVENTS.map((e) => e.city))).sort();
        return { countries, cities };
    }

    try {
        const { prisma } = await import("@/lib/db");
        const events = await prisma.event.findMany({
            where: { status: "PUBLISHED" },
            select: { country: true, city: true },
            distinct: ["country", "city"],
        });

        const countries = Array.from<string>(new Set(events.map((e: { country: string; city: string }) => e.country))).sort();
        const cities = Array.from<string>(new Set(events.map((e: { country: string; city: string }) => e.city))).sort();

        return { countries, cities };
    } catch {
        const countries = Array.from(new Set(MOCK_EVENTS.map((e) => e.country))).sort();
        const cities = Array.from(new Set(MOCK_EVENTS.map((e) => e.city))).sort();
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
        events = events.filter(e => e.country.toLowerCase().includes(params.country!.toLowerCase()));
    }
    if (params.city) {
        events = events.filter(e => e.city.toLowerCase().includes(params.city!.toLowerCase()));
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
            {/* Cinematic Hero */}
            <section className="relative py-32 md:py-40 hero-gradient overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute inset-0 pattern-dots opacity-20" />
                <div className="absolute top-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

                <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-8 animate-fade-up">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        <span className="text-white/90 text-sm font-medium tracking-wide">
                            Global Education Opportunities
                        </span>
                    </div>
                    <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                        Explore World-Class <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                            Education Events
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                        Connect with top universities worldwide. Discover scholarships, programs, and career paths at our exclusive education fairs.
                    </p>
                </div>

                {/* Wave Bottom */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 80C240 80 480 80 720 80C960 80 1200 80 1440 80V0H0V80Z" fill="hsl(var(--background))" />
                    </svg>
                </div>
            </section>

            {/* Glassmorphic Filter Bar - Floating */}
            <div className="container mx-auto px-4 -mt-12 relative z-20 mb-16">
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 md:p-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                    <form className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Input
                                type="search"
                                name="search"
                                placeholder="Search by event name..."
                                defaultValue={params.search}
                                className="w-full h-12 bg-white/50 border-gray-200 focus:border-accent focus:ring-accent rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                            <select
                                name="country"
                                defaultValue={params.country}
                                className="h-12 bg-white/50 border border-gray-200 text-gray-700 px-4 text-sm rounded-xl focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
                                className="h-12 bg-white/50 border border-gray-200 text-gray-700 px-4 text-sm rounded-xl focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                            >
                                <option value="">All Cities</option>
                                {filterOptions.cities.map((city: string) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button
                            type="submit"
                            variant="accent"
                            size="lg"
                            className="w-full md:w-auto h-12 px-8 rounded-xl shadow-lg shadow-accent/20"
                        >
                            Find Events
                        </Button>
                        {(params.search || params.country || params.city) && (
                            <Button
                                variant="ghost"
                                asChild
                                className="h-12 px-4 text-muted-foreground hover:text-accent"
                            >
                                <Link href="/events">Reset</Link>
                            </Button>
                        )}
                    </form>
                </div>
            </div>

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
            className={`group block h-full ${!isUpcoming ? "opacity-75 hover:opacity-100 transition-opacity" : ""}`}
        >
            <article className="relative h-full bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                {/* Image Container */}
                <div className="aspect-[16/10] relative overflow-hidden">
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />

                    {event.bannerImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={event.bannerImageUrl}
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-secondary/30">
                            <span className="text-5xl opacity-20">🎓</span>
                        </div>
                    )}

                    {/* Floating Date Badge */}
                    <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg flex flex-col items-center min-w-[60px]">
                        <span className="text-xs font-bold text-accent uppercase tracking-wider">
                            {format(new Date(event.startDateTime), "MMM")}
                        </span>
                        <span className="text-xl font-bold text-foreground leading-none">
                            {format(new Date(event.startDateTime), "d")}
                        </span>
                    </div>

                    {/* Status Badge */}
                    {!isUpcoming && (
                        <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
                            Past Event
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                {event.city}, {event.country}
                            </span>
                        </div>
                        <h3 className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight group-hover:text-accent transition-colors mb-3">
                            {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>📍 {event.venueName}</span>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                            {isUpcoming ? "Register Free" : "View Recap"}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300">
                            <span className="text-lg leading-none mb-0.5">→</span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
