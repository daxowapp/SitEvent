export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { RegistrationForm } from "./registration-form";
import { TrackingScripts } from "@/components/tracking-scripts";
import { ImageCarousel } from "@/components/public/image-carousel";
import { MapPin, Calendar, Info, GraduationCap, ChevronLeft, Building2, CheckCircle, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/public/countdown-timer";
import { getTranslations } from "next-intl/server";

interface EventPageProps {
    params: Promise<{ slug: string; locale: string }>;
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
        // Mock translations
        titleTranslations: {
            tr: "İstanbul Eğitim Fuarı 2026",
            ar: "معرض إسطنبول التعليمي 2026"
        },
        descriptionTranslations: {
            tr: "İstanbul'daki önde gelen eğitim fuarına katılın via.",
            ar: "انضم إلينا في معرض التعليم الرائد في إسطنبول."
        },
        registrationOpenAt: new Date("2025-01-01"),
        registrationCloseAt: new Date("2026-03-14"),
        capacity: 500,
        universities: [
            { university: { id: "u1", name: "University of Oxford", logoUrl: null }, boothNumber: "A1" },
            { university: { id: "u2", name: "MIT", logoUrl: null }, boothNumber: "B2" },
            { university: { id: "u3", name: "University of Toronto", logoUrl: null }, boothNumber: "C3" },
        ],
        sessions: [
            {
                id: "s1",
                title: "Opening Ceremony",
                description: "Welcome speech and introduction to the fair.",
                startTime: new Date("2026-03-15T10:00:00"),
                endTime: new Date("2026-03-15T10:30:00"),
                location: "Main Hall",
                speaker: "Dr. John Doe",
                order: 0
            },
            {
                id: "s2",
                title: "Study in UK",
                description: "Everything you need to know about studying in the United Kingdom.",
                startTime: new Date("2026-03-15T11:00:00"),
                endTime: new Date("2026-03-15T12:00:00"),
                location: "Seminar Room A",
                speaker: "Jane Smith",
                order: 1
            }
        ],
        _count: { registrations: 124 }
    },
];

async function getEvent(slug: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { slug },
            include: {
                universities: {
                    include: {
                        university: true,
                    },
                },
                sessions: {
                    orderBy: {
                        startTime: 'asc',
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
        console.warn("Database fetch failed, falling back to mock");
    }

    // Fallback to mock data
    return MOCK_EVENTS.find(e => e.slug === slug) || null;
}

// Helper to get translated content
function getLocalizedContent(
    translations: any,
    fallback: string | null,
    locale: string
): string {
    if (!translations || typeof translations !== 'object') return fallback || '';
    return translations[locale] || translations['en'] || fallback || '';
}

export default async function EventPage({ params }: EventPageProps) {
    const { slug, locale } = await params;
    const event = await getEvent(slug);
    const t = await getTranslations({ locale, namespace: "events" });

    if (!event || event.status !== "PUBLISHED") {
        notFound();
    }

    // Get localized content
    const displayTitle = getLocalizedContent((event as any).titleTranslations, event.title, locale);
    const displayDescription = getLocalizedContent((event as any).descriptionTranslations, event.description, locale);

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
        <div className="min-h-screen bg-background pb-20">
            {/* Navbar Spacer Removed to allow transparent header to overlay hero */}


            {/* Immersive Cinematic Hero - Pro Max Style (Optimized Height) */}
            <section className="relative min-h-[55vh] flex items-center justify-center pt-10 pb-20 hero-gradient overflow-hidden">
                {/* Contextual Background Image (Blended) */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1920&auto=format&fit=crop"
                        alt="Event Context"
                        className="w-full h-full object-cover opacity-10 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/80 to-primary/60 mix-blend-multiply" />
                </div>

                {/* Noise Texture for Film Grain Effect */}
                <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none z-10"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />

                {/* Background Pattern */}
                <div className="absolute inset-0 pattern-dots opacity-30 z-10" />

                {/* Vignette */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 z-10" />

                {/* Dynamic Gradient Blobs */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/30 rounded-full blur-[120px] opacity-40 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-primary-foreground/10 rounded-full blur-[120px] opacity-40" />

                <div className="container relative mx-auto px-6 md:px-12 z-20 text-center mt-12 mb-8">
                    <Link
                        href={`/${locale}/events`}
                        className="inline-flex items-center gap-2 mb-8 text-white/70 hover:text-white transition-all text-sm font-medium group animate-fade-in hover:bg-white/10 px-4 py-2 rounded-full border border-transparent hover:border-white/20"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:translate-x-1" />
                        {t('backToEvents')}
                    </Link>

                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up">
                            {isPast ? (
                                <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-md border hover:bg-white/20 border-white/20 px-4 py-1.5 text-sm uppercase tracking-wide">{t('pastEvent')}</Badge>
                            ) : (
                                <Badge className="bg-white/10 text-white backdrop-blur-md border hover:bg-white/20 border-white/20 px-4 py-1.5 text-sm uppercase tracking-wide">{t('upcomingEvent')}</Badge>
                            )}
                            {isRegistrationOpen && (
                                <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-0 animate-pulse px-4 py-1.5 text-sm uppercase tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                                    {t('registrationOpen')}
                                </Badge>
                            )}
                        </div>

                        {/* Massive Title */}
                        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] animate-fade-up tracking-tight drop-shadow-2xl" style={{ animationDelay: "0.1s" }}>
                            {displayTitle}
                        </h1>

                        {/* Metadata */}
                        <div className="flex flex-wrap justify-center gap-8 text-white/90 pt-4 text-lg md:text-xl animate-fade-up font-light" style={{ animationDelay: "0.2s" }}>
                            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
                                <Calendar className="w-5 h-5 text-accent-foreground" />
                                <span>{format(new Date(event.startDateTime), "MMMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
                                <MapPin className="w-5 h-5 text-accent-foreground" />
                                <span>{event.city}, {event.country}</span>
                            </div>
                        </div>

                        {/* Countdown */}
                        {!isPast && (
                            <div className="pt-8 pb-4">
                                <CountdownTimer targetDate={new Date(event.startDateTime)} />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Overlapping Content Container */}
            <div className="container mx-auto px-4 md:px-6 lg:px-12 relative z-30 -mt-24 md:-mt-24">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Content Column */}
                    <div className="lg:col-span-8 space-y-12 order-2 lg:order-1">
                        {/* Gallery - Floating Card Effect */}
                        {gallery.length > 0 && (
                            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/20 card-elevated aspect-video border-4 border-white/20 animate-fade-up ring-1 ring-black/5" style={{ animationDelay: "0.3s" }}>
                                <ImageCarousel images={gallery} alt={displayTitle} />
                            </div>
                        )}

                        {/* About Section */}
                        {displayDescription && (
                            <div className="bg-card rounded-3xl p-8 md:p-10 card-elevated border border-border/50 shadow-xl space-y-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
                                <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <h2 className="font-display text-3xl font-bold text-card-foreground">
                                        {t('aboutEvent')}
                                    </h2>
                                </div>
                                <div className="prose prose-lg text-muted-foreground leading-loose max-w-none">
                                    {displayDescription.split("\n").map((paragraph: string, i: number) => (
                                        <p key={i} className="mb-4">{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Event Program */}
                        {(event as any).sessions && (event as any).sessions.length > 0 && (
                            <div className="bg-card rounded-3xl p-8 md:p-10 card-elevated border border-border/50 shadow-xl space-y-8 animate-fade-up" style={{ animationDelay: "0.45s" }}>
                                <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <h2 className="font-display text-3xl font-bold text-card-foreground">
                                        Event Program
                                    </h2>
                                </div>
                                <div className="space-y-6">
                                    {(event as any).sessions.map((session: any) => (
                                        <div key={session.id} className="flex gap-6 relative pl-8 border-l-2 border-primary/20 last:border-0 pb-6 last:pb-0">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                                            <div className="flex-1 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                                                        {format(new Date(session.startTime), "HH:mm")} - {format(new Date(session.endTime), "HH:mm")}
                                                    </Badge>
                                                    {session.location && (
                                                        <Badge variant="secondary" className="text-muted-foreground">
                                                            📍 {session.location}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold text-card-foreground">{session.title}</h3>
                                                {session.description && (
                                                    <p className="text-muted-foreground leading-relaxed">{session.description}</p>
                                                )}
                                                {session.speaker && (
                                                    <div className="flex items-center gap-2 pt-2 text-sm font-medium text-foreground/80">
                                                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">🎤</div>
                                                        <span>{session.speaker}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Participating Universities */}
                        {event.universities && event.universities.length > 0 && (
                            <div className="bg-card rounded-3xl p-8 md:p-10 card-elevated border border-border/50 shadow-xl space-y-8 animate-fade-up" style={{ animationDelay: "0.5s" }}>
                                <div className="flex items-center justify-between border-b border-border/50 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                            <GraduationCap className="w-6 h-6" />
                                        </div>
                                        <h2 className="font-display text-3xl font-bold text-card-foreground">
                                            {t('participatingUniversitiesTitle')}
                                        </h2>
                                    </div>
                                    <Badge variant="secondary" className="text-base px-4 py-1">
                                        {t('universitiesCount', { count: event.universities.length })}
                                    </Badge>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {(event.universities as any[]).map(({ university, boothNumber }: { university: { id: string; name: string; logoUrl: string | null }; boothNumber: string | null }) => (
                                        <Link
                                            key={university.id}
                                            href={`/${locale}/university/${university.id}`}
                                            className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group bg-background/50 backdrop-blur-sm"
                                        >
                                            <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 p-2">
                                                {university.logoUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={university.logoUrl}
                                                        alt={university.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <Building2 className="w-8 h-8 text-muted-foreground/20" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-lg text-card-foreground truncate group-hover:text-primary transition-colors">
                                                    {university.name}
                                                </p>
                                                {boothNumber && (
                                                    <p className="text-sm text-muted-foreground font-medium mt-0.5">
                                                        {t('booth')} <span className="text-foreground font-bold">{boothNumber}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sticky Sidebar */}
                    <div className="lg:col-span-4 relative order-1 lg:order-2">
                        <div className="sticky top-28 space-y-8 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                            {/* Registration Card - Main Focus */}
                            {isRegistrationOpen ? (
                                <div className="transform transition-all duration-500 hover:scale-[1.02]">
                                    {/* Attention Grabber Flag */}
                                    <div className="absolute -top-4 -right-4 z-20 animate-bounce hidden md:block">
                                        <div className="bg-primary text-white font-bold px-4 py-2 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
                                            {t('startHere')} <ArrowDown className="w-4 h-4" />
                                        </div>
                                    </div>

                                    <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_-12px_hsl(var(--primary)/0.5)] border border-primary/10 overflow-hidden relative card-elevated">
                                        {/* Glass Full Background Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(355deg_85%_45%_/_0%)] to-primary/5 pointer-events-none" />

                                        {/* Urgency Ribbon */}
                                        {spotsLeft && spotsLeft < 100 && (
                                            <div className="relative bg-amber-500/10 text-amber-700 text-xs font-bold px-6 py-2.5 text-center border-b border-amber-500/20 backdrop-blur-sm">
                                                🔥 {t('almostFull', { count: spotsLeft })}
                                            </div>
                                        )}

                                        <div className="p-8 space-y-8 relative">
                                            <div className="space-y-2 text-center">
                                                <h3 className="font-display text-3xl font-bold text-card-foreground">
                                                    {t('secureYourSpot')}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {t('getQrCode')}
                                                </p>
                                            </div>

                                            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                                                <RegistrationForm eventId={event.id} eventSlug={event.slug} />
                                            </div>

                                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 bg-secondary/50 py-2 rounded-lg">
                                                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                                <span>{t('instantConfirmation')}</span>
                                                <span className="w-1 h-1 bg-border rounded-full" />
                                                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                                <span>{t('freeEntry')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-secondary/30 backdrop-blur-md rounded-3xl p-10 text-center border-2 border-dashed border-border/60">
                                    <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm ring-4 ring-background/50">
                                        {isPast ? "📅" : "🔒"}
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2 font-display">
                                        {t('registrationClosed')}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {isPast
                                            ? t('eventTakenPlace')
                                            : t('registrationUnavailable')}
                                    </p>
                                </div>
                            )}

                            {/* Event Details Card */}
                            <div className="bg-card/80 backdrop-blur-md rounded-3xl border border-border/50 p-8 shadow-lg">
                                <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-6 pl-1">
                                    {t('eventInformation')}
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex gap-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-card-foreground text-lg">{t('dateTime')}</p>
                                            <p className="text-muted-foreground mt-1">{format(new Date(event.startDateTime), "MMMM d, yyyy")}</p>
                                            <p className="text-muted-foreground/80 text-sm">{format(new Date(event.startDateTime), "h:mm a")} - {format(new Date(event.endDateTime), "h:mm a")}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-card-foreground text-lg">{t('location')}</p>
                                            <p className="text-muted-foreground mt-1">{event.venueName}</p>
                                            <p className="text-muted-foreground/80 text-sm">{event.venueAddress}</p>
                                            {event.mapUrl && (
                                                <a
                                                    href={event.mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full"
                                                >
                                                    {t('openInMaps')} →
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
