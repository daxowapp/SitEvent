import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface EventParticipation {
    event: {
        id: string;
        title: string;
        slug: string;
        city: string | null;
        country: string | null;
        startDateTime: Date;
        endDateTime: Date;
        _count: {
            registrations: number;
        }
    };
    boothNumber: string | null;
}

export default async function UniversityEventsPage() {
    const session = await auth();
    const t = await getTranslations('university.events');

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    // Get all events where this university is participating (ACCEPTED or INVITED)
    const participations = await prisma.eventParticipating.findMany({
        where: {
            universityId: session.user.universityId,
            status: { in: ["ACCEPTED", "INVITED"] }
        },
        include: {
            event: {
                include: {
                    _count: {
                        select: { registrations: true }
                    }
                }
            }
        },
        orderBy: {
            event: { startDateTime: 'desc' }
        }
    }) as unknown as EventParticipation[];

    // Separate active (upcoming/ongoing) and past events
    const now = new Date();
    const activeEvents = participations.filter(p => p.event.endDateTime >= now);
    const pastEvents = participations.filter(p => p.event.endDateTime < now);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
                <p className="text-slate-500 mt-1">{t('subtitle')}</p>
            </div>

            {/* Active Events */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {t('activeEvents')} ({activeEvents.length})
                </h2>
                
                {activeEvents.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-8 text-center">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">{t('noActiveEvents')}</p>
                        <Link 
                            href="/university/explore" 
                            className="text-red-500 hover:text-red-600 text-sm font-medium mt-2 inline-block"
                        >
                            {t('browseMarket')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {activeEvents.map(({ event, boothNumber }) => (
                            <Link 
                                key={event.id}
                                href={`/university/events/${event.id}`}
                                className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-red-200 hover:shadow-lg hover:shadow-red-100/50 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                {t('statusActive')}
                                            </span>
                                            {boothNumber && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                                    {t('booth')} {boothNumber}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <h3 className="font-semibold text-lg text-slate-900 group-hover:text-red-600 transition-colors">
                                            {event.title}
                                        </h3>
                                        
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {format(event.startDateTime, "MMM d, yyyy")}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4" />
                                                {event.city}, {event.country}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                {event._count.registrations} {t('students')}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Events */}
            {pastEvents.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-600">
                        {t('pastEvents')} ({pastEvents.length})
                    </h2>
                    
                    <div className="grid gap-3">
                        {pastEvents.map(({ event }) => (
                            <Link 
                                key={event.id}
                                href={`/university/events/${event.id}`}
                                className="group bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-slate-700 group-hover:text-slate-900">
                                            {event.title}
                                        </h3>
                                        <div className="flex gap-3 text-sm text-slate-400">
                                            <span>{format(event.startDateTime, "MMM d, yyyy")}</span>
                                            <span>{event.city}, {event.country}</span>
                                            <span>{event._count.registrations} {t('students')}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
