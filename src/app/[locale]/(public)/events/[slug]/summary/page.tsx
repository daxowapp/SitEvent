import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatInTimeZone } from "date-fns-tz";
import { TrackingScripts } from "@/components/tracking-scripts";
import { ImageCarousel } from "@/components/public/image-carousel";
import { EventSummaryCharts } from "@/components/public/event-summary-charts";
import { MapPin, Calendar, Info, GraduationCap, ChevronLeft, Building2, Users, LayoutList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface EventSummaryPageProps {
    params: Promise<{ slug: string; locale: string }>;
}

async function getEventSummary(slug: string) {
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
                    select: { registrations: true, universities: true, sessions: true },
                },
                registrations: {
                    select: {
                        registrant: {
                            select: {
                                country: true,
                                levelOfStudy: true,
                            }
                        }
                    }
                }
            },
        });
        return event;
    } catch (error) {
        console.warn("Database fetch failed");
        return null;
    }
}

// Helper to get localized content
function getLocalizedContent(
    translations: any,
    fallback: string | null,
    locale: string
): string {
    if (!translations || typeof translations !== 'object') return fallback || '';
    return translations[locale] || translations['en'] || fallback || '';
}

export default async function EventSummaryPage({ params }: EventSummaryPageProps) {
    const { slug, locale } = await params;
    const event = await getEventSummary(slug);
    const t = await getTranslations({ locale, namespace: "events" });

    if (!event || event.status !== "PUBLISHED") {
        notFound();
    }

    // Only show summary for past events (or allow it anyway, but it's meant for past)
    const now = new Date();
    const isPast = new Date(event.endDateTime) < now;

    // Get localized content
    const displayTitle = getLocalizedContent((event as any).titleTranslations, event.title, locale);
    const displayDescription = getLocalizedContent((event as any).descriptionTranslations, event.description, locale);
    
    const timeZone = event.timezone || "UTC";

    // Calculate chart data
    const countryMap = new Map<string, number>();
    const studyLevelMap = new Map<string, number>();

    event.registrations?.forEach((reg: any) => {
        if (reg.registrant?.country) {
            const c = reg.registrant.country;
            countryMap.set(c, (countryMap.get(c) || 0) + 1);
        }
        if (reg.registrant?.levelOfStudy) {
            const l = reg.registrant.levelOfStudy;
            studyLevelMap.set(l, (studyLevelMap.get(l) || 0) + 1);
        }
    });

    const topCountries = Array.from(countryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    const topStudyLevels = Array.from(studyLevelMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    // Ensure we have a gallery (fallback to banner if no gallery)
    const gallery = (event as any).galleryImages && (event as any).galleryImages.length > 0
        ? (event as any).galleryImages
        : event.bannerImageUrl ? [event.bannerImageUrl] : [];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Immersive Cinematic Hero - Pro Max Style */}
            <section className="relative min-h-[50vh] flex items-center justify-center pt-10 pb-20 hero-gradient overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={event.bannerImageUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1920&auto=format&fit=crop"}
                        alt="Event Context"
                        className="w-full h-full object-cover opacity-20 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-primary/60 mix-blend-multiply" />
                </div>

                <div className="absolute inset-0 pattern-dots opacity-30 z-10" />
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 z-10" />

                <div className="container relative mx-auto px-6 md:px-12 z-20 text-center mt-12 mb-8">
                    <Link
                        href={`/${locale}/events`}
                        className="inline-flex items-center gap-2 mb-8 text-white/70 hover:text-white transition-all text-sm font-medium group animate-fade-in hover:bg-white/10 px-4 py-2 rounded-full border border-transparent hover:border-white/20"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:translate-x-1" />
                        {t('backToEvents') || "Back to Events"}
                    </Link>

                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up">
                            <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-md border hover:bg-white/20 border-white/20 px-4 py-1.5 text-sm uppercase tracking-wide">
                                Event Recap
                            </Badge>
                            {isPast && (
                                <Badge className="bg-accent/80 text-white border-0 px-4 py-1.5 text-sm uppercase tracking-wide">
                                    {t('pastEvent') || "Past Event"}
                                </Badge>
                            )}
                        </div>

                        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] animate-fade-up tracking-tight drop-shadow-2xl" style={{ animationDelay: "0.1s" }}>
                            {displayTitle}
                        </h1>

                        <div className="flex flex-wrap justify-center gap-8 text-white/90 pt-4 text-lg md:text-xl animate-fade-up font-light" style={{ animationDelay: "0.2s" }}>
                            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
                                <Calendar className="w-5 h-5 text-accent" />
                                <span>{formatInTimeZone(new Date(event.startDateTime), timeZone, "MMMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
                                <MapPin className="w-5 h-5 text-accent" />
                                <span>{event.city}, {event.country}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 md:px-6 lg:px-12 relative z-30 -mt-16">
                
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                    <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-xl flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <Users className="w-7 h-7" />
                        </div>
                        <p className="text-4xl font-display font-bold text-foreground mb-1">{event._count.registrations}</p>
                        <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Registrations</p>
                    </div>
                    <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-xl flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                            <GraduationCap className="w-7 h-7" />
                        </div>
                        <p className="text-4xl font-display font-bold text-foreground mb-1">{event._count.universities}</p>
                        <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Participating Universities</p>
                    </div>
                    <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-xl flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                            <LayoutList className="w-7 h-7" />
                        </div>
                        <p className="text-4xl font-display font-bold text-foreground mb-1">{event._count.sessions}</p>
                        <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Event Sessions</p>
                    </div>
                </div>

                {/* Charts */}
                {(topCountries.length > 0 || topStudyLevels.length > 0) && (
                    <EventSummaryCharts 
                        countryData={topCountries} 
                        studyLevelData={topStudyLevels} 
                    />
                )}

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Content Column */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Gallery - Floating Card Effect */}
                        {gallery.length > 0 && (
                            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/20 card-elevated aspect-video border-4 border-white/20 animate-fade-up ring-1 ring-black/5" style={{ animationDelay: "0.4s" }}>
                                <ImageCarousel images={gallery} alt={displayTitle} />
                            </div>
                        )}

                        {/* About Section */}
                        {displayDescription && (
                            <div className="bg-card rounded-3xl p-8 md:p-10 card-elevated border border-border/50 shadow-xl space-y-8 animate-fade-up" style={{ animationDelay: "0.5s" }}>
                                <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <h2 className="font-display text-3xl font-bold text-card-foreground">
                                        {t('aboutEvent') || "About The Event"}
                                    </h2>
                                </div>
                                <div className="prose prose-lg text-muted-foreground leading-loose max-w-none">
                                    {displayDescription.split("\n").map((paragraph: string, i: number) => (
                                        <p key={i} className="mb-4">{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sticky Sidebar */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-28 space-y-8 animate-fade-up" style={{ animationDelay: "0.6s" }}>
                            
                            {/* Participating Universities */}
                            {event.universities && event.universities.length > 0 && (
                                <div className="bg-card/80 backdrop-blur-md rounded-3xl border border-border/50 p-8 shadow-lg">
                                    <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-6 pl-1">
                                        {t('participatingUniversitiesTitle') || "Participating Universities"}
                                    </h3>

                                    <div className="flex flex-col gap-3">
                                        {(event.universities as any[]).map(({ university }: { university: { id: string; name: string; logoUrl: string | null } }) => (
                                            <Link
                                                key={university.id}
                                                href={`/${locale}/university/${university.id}`}
                                                className="flex items-center gap-4 p-3 rounded-2xl border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all group bg-background/50"
                                            >
                                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 p-1">
                                                    {university.logoUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={university.logoUrl}
                                                            alt={university.name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <Building2 className="w-5 h-5 text-muted-foreground/20" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-card-foreground truncate group-hover:text-primary transition-colors">
                                                        {university.name}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

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
