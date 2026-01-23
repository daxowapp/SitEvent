
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { ImageCarousel } from "@/components/public/image-carousel";
import { MapPin, Calendar, Globe, Mail, Phone, Building2, ChevronLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface UniversityPageProps {
    params: Promise<{ id: string; locale: string }>;
}

async function getUniversity(id: string) {
    return prisma.university.findUnique({
        where: { id },
        include: {
            events: {
                include: {
                    event: true
                },
                orderBy: {
                    event: {
                        startDateTime: 'asc'
                    }
                }
            }
        }
    });
}

export default async function UniversityPage({ params }: UniversityPageProps) {
    const { id, locale } = await params;
    const university = await getUniversity(id);
    const t = await getTranslations({ locale, namespace: "events" });

    if (!university) {
        notFound();
    }

    const upcomingEvents = university.events.filter(e => new Date(e.event.startDateTime) > new Date());
    const pastEvents = university.events.filter(e => new Date(e.event.startDateTime) <= new Date());

    // Programs as array
    const programs = Array.isArray(university.programs) ? university.programs as string[] : [];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Navbar Spacer */}
            <div className="h-20" />

            {/* Hero Profile Header */}
            <div className="bg-secondary/20 border-b border-border/50 pb-16 pt-12">
                <div className="container mx-auto px-4 md:px-6">
                    <Link
                        href={`/${locale}/events`}
                        className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                    >
                        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                        {t('backToEvents')}
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-border p-4 shrink-0">
                            {university.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={university.logoUrl}
                                    alt={university.name}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Building2 className="w-16 h-16 text-muted-foreground/20" />
                            )}
                        </div>

                        <div className="space-y-4 flex-1">
                            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                                {university.name}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    <span>{university.country}{university.city ? `, ${university.city}` : ''}</span>
                                </div>
                                {university.website && (
                                    <a href={university.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors hover:underline">
                                        <Globe className="w-4 h-4" />
                                        <span>Website</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 -mt-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Info & Programs */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About Card */}
                        <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm">
                            <h2 className="font-display text-2xl font-bold mb-6">About University</h2>
                            <div className="prose prose-lg text-muted-foreground leading-relaxed">
                                {university.description ? (
                                    university.description.split("\n").map((p, i) => <p key={i}>{p}</p>)
                                ) : (
                                    <p>No description available.</p>
                                )}
                            </div>
                        </div>

                        {/* Programs Card */}
                        {programs.length > 0 && (
                            <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm">
                                <h2 className="font-display text-2xl font-bold mb-6">Key Programs</h2>
                                <div className="flex flex-wrap gap-3">
                                    {programs.map((program, i) => (
                                        <Badge key={i} variant="secondary" className="px-4 py-2 text-sm font-normal bg-secondary hover:bg-secondary/80">
                                            {program}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Events List */}
                        <div className="space-y-6">
                            <h2 className="font-display text-2xl font-bold">Upcoming Events</h2>
                            {upcomingEvents.length > 0 ? (
                                <div className="grid gap-4">
                                    {upcomingEvents.map((ep) => (
                                        <Link
                                            key={ep.eventId}
                                            href={`/${locale}/events/${ep.event.slug}`}
                                            className="group block bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex flex-col items-center justify-center text-primary shrink-0 border border-primary/10">
                                                        <span className="text-xs font-bold uppercase">{format(new Date(ep.event.startDateTime), "MMM")}</span>
                                                        <span className="text-2xl font-bold leading-none">{format(new Date(ep.event.startDateTime), "dd")}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                                                            {ep.event.title}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4" />
                                                                {ep.event.venueName}, {ep.event.city}
                                                            </div>
                                                            {ep.boothNumber && (
                                                                <div className="flex items-center gap-1.5 text-foreground font-medium bg-secondary px-2 py-0.5 rounded-md">
                                                                    Booth {ep.boothNumber}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-primary font-bold text-sm self-end md:self-center bg-primary/5 px-4 py-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                                                    View Event <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border text-muted-foreground">
                                    No upcoming events scheduled.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Contact & Stats */}
                    <div className="space-y-8">
                        <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm sticky top-28">
                            <h2 className="font-display text-xl font-bold mb-6">Contact Information</h2>
                            <div className="space-y-6">
                                {university.contactEmail && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">Email Address</p>
                                            <a href={`mailto:${university.contactEmail}`} className="text-muted-foreground hover:text-primary transition-colors truncate block">
                                                {university.contactEmail}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {university.contactPhone && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">Phone Number</p>
                                            <a href={`tel:${university.contactPhone}`} className="text-muted-foreground hover:text-primary transition-colors truncate block" dir="ltr">
                                                {university.contactPhone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-border/50">
                                    <div className="bg-secondary/30 rounded-2xl p-4">
                                        <p className="text-sm text-center text-muted-foreground">
                                            Meeting students at <strong className="text-foreground">{upcomingEvents.length} upcoming events</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const dynamic = "force-dynamic";
