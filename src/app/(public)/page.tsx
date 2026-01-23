import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

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

async function getUpcomingEvents(): Promise<DisplayEvent[]> {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[project-ref]')) {
        return [];
    }

    try {
        const { prisma } = await import("@/lib/db");
        const events = await prisma.event.findMany({
            where: {
                status: "PUBLISHED",
                startDateTime: { gte: new Date() },
            },
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

export default async function HomePage() {
    const [upcomingEvents, pastEvents] = await Promise.all([
        getUpcomingEvents(),
        getPastEvents(),
    ]);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Turkish Flag Theme */}
            <section className="relative min-h-[90vh] flex items-center">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `linear-gradient(to right, 
                            rgba(255, 255, 255, 0.95), 
                            rgba(255, 255, 255, 0.7)), 
                            url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1920&q=80')`
                    }}
                />

                {/* Decorative Red Strip */}
                <div className="absolute top-0 left-0 w-2 h-full bg-[hsl(var(--turkish-red))]" />

                <div className="container relative mx-auto px-6 md:px-12 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left - Main Content */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 animate-fade-in">
                                <span className="w-12 h-1 bg-[hsl(var(--turkish-red))]" />
                                <span className="text-sm tracking-widest uppercase text-[hsl(var(--turkish-red))] font-bold">
                                    Education Events
                                </span>
                            </div>

                            <h1 className="display-text text-5xl md:text-6xl lg:text-7xl text-gray-900 animate-fade-in delay-100 font-bold">
                                Your Journey to
                                <br />
                                <span className="text-[hsl(var(--turkish-red))] italic">World-Class</span>
                                <br />
                                Education Starts Here
                            </h1>

                            <p className="body-text text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed animate-fade-in delay-200">
                                Connect with prestigious universities from around the globe.
                                Discover opportunities that shape futures using our curated event platform.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in delay-300">
                                <Button
                                    size="lg"
                                    asChild
                                    className="btn-primary px-8 py-6 text-sm tracking-widest uppercase font-semibold shadow-lg shadow-red-200"
                                >
                                    <Link href="/events">Explore Events</Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    asChild
                                    className="btn-outline px-8 py-6 text-sm tracking-widest uppercase font-semibold"
                                >
                                    <Link href="#upcoming">View Schedule</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Right - Stats */}
                        <div className="hidden lg:block">
                            <div className="relative">
                                {/* Decorative frame */}
                                <div className="absolute -inset-4 border-2 border-[hsl(var(--turkish-red))]/10 rounded-xl" />

                                <div className="bg-white/80 backdrop-blur-xl p-12 space-y-10 shadow-2xl shadow-gray-100 rounded-xl border border-gray-100">
                                    <div className="flex items-end gap-4 animate-fade-in delay-200">
                                        <span className="display-text text-6xl text-[hsl(var(--turkish-red))] font-bold">50+</span>
                                        <span className="text-gray-500 pb-2 font-medium">Partner Universities</span>
                                    </div>
                                    <div className="w-full h-px bg-gray-100" />
                                    <div className="flex items-end gap-4 animate-fade-in delay-300">
                                        <span className="display-text text-6xl text-[hsl(var(--turkish-red))] font-bold">10K+</span>
                                        <span className="text-gray-500 pb-2 font-medium">Students Connected</span>
                                    </div>
                                    <div className="w-full h-px bg-gray-100" />
                                    <div className="flex items-end gap-4 animate-fade-in delay-400">
                                        <span className="display-text text-6xl text-[hsl(var(--turkish-red))] font-bold">8</span>
                                        <span className="text-gray-500 pb-2 font-medium">Countries Covered</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-500">
                    <span className="text-xs tracking-widest uppercase text-gray-400">Scroll</span>
                    <div className="w-0.5 h-12 bg-gradient-to-b from-[hsl(var(--turkish-red))] to-transparent" />
                </div>
            </section>

            {/* Upcoming Events Section */}
            <section id="upcoming" className="py-24 md:py-32 bg-gray-50">
                <div className="container mx-auto px-6 md:px-12">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-3">
                                <span className="w-12 h-1 bg-[hsl(var(--turkish-red))]" />
                                <span className="text-sm tracking-widest uppercase text-[hsl(var(--turkish-red))] font-bold">
                                    Upcoming
                                </span>
                            </div>
                            <h2 className="display-text text-4xl md:text-5xl text-gray-900 font-bold">
                                Featured Events
                            </h2>
                        </div>
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 text-[hsl(var(--turkish-red))] hover:text-red-700 transition-colors font-semibold group"
                        >
                            <span className="text-sm tracking-widest uppercase">View All Events</span>
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                    </div>

                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-gray-500 text-lg">No upcoming events at the moment. Check back soon.</p>
                        </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingEvents.map((event, index) => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.slug}`}
                                    className="group block"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <article className="bg-white border border-gray-100 rounded-xl overflow-hidden card-hover h-full">
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
                                        <div className="p-8 space-y-4">
                                            <h3 className="display-text text-xl text-gray-900 line-clamp-2 group-hover:text-[hsl(var(--turkish-red))] transition-colors font-bold">
                                                {event.title}
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-[hsl(var(--turkish-red))]">📍</span>
                                                    <span>{event.city || 'TBA'}, {event.country || 'TBA'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-[hsl(var(--turkish-red))]">🏛️</span>
                                                    <span className="line-clamp-1">{event.venueName}</span>
                                                </div>
                                            </div>

                                            <div className="pt-6 mt-2 border-t border-gray-50 flex items-center justify-between">
                                                <span className="text-xs tracking-widest uppercase text-[hsl(var(--turkish-red))] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                                                    Register Now <span>→</span>
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Past Events Section */}
            {pastEvents.length > 0 && (
                <section className="py-24 md:py-32 bg-white border-t border-gray-100">
                    <div className="container mx-auto px-6 md:px-12">
                        <div className="space-y-4 mb-16">
                            <div className="inline-flex items-center gap-3">
                                <span className="w-12 h-1 bg-gray-200" />
                                <span className="text-sm tracking-widest uppercase text-gray-400 font-medium">
                                    Archive
                                </span>
                            </div>
                            <h2 className="display-text text-4xl md:text-5xl text-gray-400 font-bold">
                                Past Events
                            </h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {pastEvents.map((event) => (
                                <article
                                    key={event.id}
                                    className="p-8 border border-gray-100 bg-gray-50 rounded-xl opacity-60 grayscale hover:grayscale-0 transition-all duration-300"
                                >
                                    <Badge className="mb-6 bg-gray-200 text-gray-500 hover:bg-gray-300 border-none rounded-md px-3 py-1 text-xs tracking-widest">
                                        Past Event
                                    </Badge>
                                    <h3 className="display-text text-xl text-gray-600 mb-4 font-bold">
                                        {event.title}
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>📅</span> {format(new Date(event.startDateTime), "PPP")}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>📍</span> {event.city || 'TBA'}, {event.country || 'TBA'}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-24 md:py-32 bg-[hsl(var(--turkish-red))] text-white">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h2 className="display-text text-4xl md:text-5xl lg:text-6xl font-bold">
                            Ready to Begin Your
                            <br />
                            <span className="text-red-100 italic">Educational Journey?</span>
                        </h2>
                        <p className="text-xl text-red-50 max-w-2xl mx-auto leading-relaxed">
                            Join thousands of students who have discovered their perfect university match through our events.
                        </p>
                        <div className="pt-8">
                            <Button
                                size="lg"
                                asChild
                                className="bg-white text-[hsl(var(--turkish-red))] hover:bg-gray-50 rounded-lg px-12 py-8 text-sm tracking-widest uppercase font-bold shadow-2xl transition-all hover:scale-105"
                            >
                                <Link href="/events">Find an Event Near You</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
