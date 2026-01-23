export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { RegistrationForm } from "./registration-form";
import { TrackingScripts } from "@/components/tracking-scripts";
import { ImageCarousel } from "@/components/public/image-carousel";

interface EventPageProps {
    params: Promise<{ slug: string }>;
}

// Mock data to match the listing page
const MOCK_EVENTS = [
    {
        id: "1",
        title: "Education Fair Istanbul 2026",
        slug: "education-fair-istanbul-2026",
        country: "Turkey",
        city: "Istanbul",
        venueName: "Istanbul Congress Center",
        venueAddress: "Darülbedai Cad. No:3, 34367 Şişli/İstanbul",
        mapUrl: "https://maps.google.com/?q=Istanbul+Congress+Center",
        bannerImageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1920&q=80",
        galleryImages: [
            "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1920&q=80",
            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80",
            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80",
            "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=1920&q=80"
        ],
        startDateTime: new Date("2026-03-15T10:00:00"),
        endDateTime: new Date("2026-03-15T18:00:00"),
        status: "PUBLISHED",
        description: `Join us for the premier education fair in Istanbul. Meet representatives from top universities worldwide and explore scholarship opportunities.

This event brings together over 50 universities from the UK, USA, Canada, Australia, and Europe. Whether you are looking for undergraduate or postgraduate programs, this is your chance to get first-hand information.

Highlights:
- Face-to-face meetings with university admissions officers
- Scholarship assessments on the spot
- Seminars on visa application and student life
- Career guidance workshops`,
        registrationOpenAt: new Date("2025-01-01"),
        registrationCloseAt: new Date("2026-03-14"),
        capacity: 500,
        universities: [
            { university: { id: "u1", name: "University of Oxford", logoUrl: null }, boothNumber: "A1" },
            { university: { id: "u2", name: "MIT", logoUrl: null }, boothNumber: "B2" },
            { university: { id: "u3", name: "University of Toronto", logoUrl: null }, boothNumber: "C3" },
        ],
        _count: { registrations: 124 }
    },
    // ... Other mock events would need updates too, but for brevity we update the structure type implicitly by usage
];

async function getEvent(slug: string) {
    console.log(`Fetching event for slug: ${slug}`);

    // Always try DB first
    try {
        const event = await prisma.event.findUnique({
            where: { slug },
            include: {
                universities: {
                    include: {
                        university: true,
                    },
                },
                _count: {
                    select: { registrations: true },
                },
            },
        });
        if (event) {
            return event;
        }
    } catch (error) {
        console.error("Database fetch failed:", error);
        throw error; // Force error to be visible
    }

    // Fallback to mock data
    console.log(`Searching mock data for slug: ${slug}`);
    return MOCK_EVENTS.find(e => e.slug === slug) || null;
}



export default async function EventPage({ params }: EventPageProps) {
    const { slug } = await params;
    const event = await getEvent(slug);

    if (!event || event.status !== "PUBLISHED") {
        notFound();
    }

    const now = new Date();
    const isPast = new Date(event.startDateTime) < now;
    const isRegistrationOpen =
        !isPast &&
        (!event.registrationOpenAt || new Date(event.registrationOpenAt) <= now) &&
        (!event.registrationCloseAt || new Date(event.registrationCloseAt) > now) &&
        (!event.capacity || (event._count?.registrations ?? 0) < event.capacity);

    const spotsLeft = event.capacity
        ? event.capacity - (event._count?.registrations ?? 0)
        : null;

    // Ensure we have a gallery (fallback to banner if no gallery)
    const gallery = (event as any).galleryImages && (event as any).galleryImages.length > 0
        ? (event as any).galleryImages
        : event.bannerImageUrl ? [event.bannerImageUrl] : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Nav Push */}
            <div className="h-20" />

            {/* Split Header */}
            <section className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-6 md:px-12 py-8 md:py-12">
                    <Link
                        href="/events"
                        className="inline-flex items-center gap-2 mb-6 text-gray-500 hover:text-[hsl(var(--turkish-red))] transition-colors text-sm font-medium group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Events
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 md:items-start justify-between">
                        <div className="space-y-4 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-3 py-1 text-xs uppercase font-bold rounded-full ${isPast ? "bg-gray-100 text-gray-500" : "bg-red-50 text-[hsl(var(--turkish-red))]"}`}>
                                    {isPast ? "Past Event" : "Upcoming Event"}
                                </span>
                                {isRegistrationOpen && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs uppercase font-bold rounded-full">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Registration Open
                                    </span>
                                )}
                            </div>

                            <h1 className="display-text text-4xl md:text-5xl lg:text-6xl text-gray-900 font-bold leading-tight">
                                {event.title}
                            </h1>

                            <div className="flex flex-wrap gap-6 text-gray-600 pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[hsl(var(--turkish-red))]">📅</span>
                                    <span className="font-medium">{format(new Date(event.startDateTime), "EEEE, MMMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[hsl(var(--turkish-red))]">📍</span>
                                    <span className="font-medium">{event.city}, {event.country}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-6 md:px-12 py-12">
                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* Left Content Column */}
                    <div className="lg:col-span-7 space-y-12">
                        {/* Hero Image Slider */}
                        {gallery.length > 0 && (
                            <div className="rounded-2xl overflow-hidden shadow-lg aspect-video">
                                <ImageCarousel images={gallery} alt={event.title} />
                            </div>
                        )}

                        {/* About Section */}
                        {event.description && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[hsl(var(--turkish-red))]">
                                        ℹ️
                                    </div>
                                    <h2 className="display-text text-2xl text-gray-900 font-bold">
                                        About This Event
                                    </h2>
                                </div>
                                <div className="prose prose-lg text-gray-600 leading-relaxed max-w-none">
                                    {event.description.split("\n").map((paragraph: string, i: number) => (
                                        <p key={i} className="mb-4">{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Participating Universities */}
                        {event.universities && event.universities.length > 0 && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-8">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[hsl(var(--turkish-red))]">
                                            🎓
                                        </div>
                                        <h2 className="display-text text-2xl text-gray-900 font-bold">
                                            Participating Universities
                                        </h2>
                                    </div>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
                                        {event.universities.length} Universities
                                    </span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {event.universities.map(({ university, boothNumber }: { university: { id: string; name: string; logoUrl: string | null }; boothNumber: string | null }) => (
                                        <div
                                            key={university.id}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[hsl(var(--turkish-red))] hover:shadow-md transition-all group bg-gray-50/50"
                                        >
                                            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                                {university.logoUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={university.logoUrl}
                                                        alt={university.name}
                                                        className="w-8 h-8 object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-xl opacity-30">🏛️</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate group-hover:text-[hsl(var(--turkish-red))] transition-colors">
                                                    {university.name}
                                                </p>
                                                {boothNumber && (
                                                    <p className="text-xs text-gray-500 font-medium mt-1">
                                                        Booth {boothNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sticky Sidebar */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-24 space-y-8">
                            {/* Registration Card - Main Focus */}
                            {isRegistrationOpen ? (
                                <div className="bg-white rounded-2xl shadow-xl shadow-[hsl(var(--turkish-red))]/5 border border-[hsl(var(--turkish-red))]/20 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-[hsl(var(--turkish-red))]" />

                                    <div className="p-8 space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="display-text text-3xl font-bold text-gray-900">
                                                Secure Your Spot
                                            </h3>
                                            <p className="text-gray-500">
                                                Fill out the form below to register for this event.
                                                {spotsLeft && spotsLeft < 100 && (
                                                    <span className="block mt-2 text-amber-600 font-medium text-sm bg-amber-50 py-1 px-2 rounded-md inline-block">
                                                        🔥 Only {spotsLeft} spots left!
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                            <RegistrationForm eventId={event.id} eventSlug={event.slug} />
                                        </div>

                                        <p className="text-xs text-center text-gray-400">
                                            By registering, you agree to our Terms of Service.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                        {isPast ? "📅" : "🔒"}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Registration Closed
                                    </h3>
                                    <p className="text-gray-500">
                                        {isPast
                                            ? "This event has already taken place."
                                            : "Registration is currently unavailable."}
                                    </p>
                                </div>
                            )}

                            {/* Event Details Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                                <h3 className="text-sm uppercase tracking-widest font-bold text-gray-400 mb-6">
                                    Event Information
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-[hsl(var(--turkish-red))] shrink-0">
                                            📅
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Date & Time</p>
                                            <p className="text-gray-600 text-sm mt-1">{format(new Date(event.startDateTime), "MMMM d, yyyy")}</p>
                                            <p className="text-gray-500 text-sm">{format(new Date(event.startDateTime), "h:mm a")} - {format(new Date(event.endDateTime), "h:mm a")}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-[hsl(var(--turkish-red))] shrink-0">
                                            📍
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Location</p>
                                            <p className="text-gray-600 text-sm mt-1">{event.venueName}</p>
                                            <p className="text-gray-500 text-sm">{event.venueAddress}</p>
                                            {event.mapUrl && (
                                                <a
                                                    href={event.mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[hsl(var(--turkish-red))] hover:underline"
                                                >
                                                    Open in Maps →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Marketing Tracking Scripts */}
            <TrackingScripts
                gaTrackingId={(event as any).gaTrackingId}
                fbPixelId={(event as any).fbPixelId}
                linkedInPartnerId={(event as any).linkedInPartnerId}
                tiktokPixelId={(event as any).tiktokPixelId}
                snapPixelId={(event as any).snapPixelId}
                customHeadScript={(event as any).customHeadScript}
                customBodyScript={(event as any).customBodyScript}
            />
        </div>
    );
}
