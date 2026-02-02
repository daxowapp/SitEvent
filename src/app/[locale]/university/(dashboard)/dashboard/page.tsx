import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default async function UniversityDashboard() {
    const session = await auth();

    // Double check auth (layout handles it but good for safety)
    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    const universityId = session.user.universityId;

    // Fetch university data to get name and accepted events
    const university = await prisma.university.findUnique({
        where: { id: universityId },
        include: {
            events: {
                include: { event: true },
            }
        }
    });

    if (!university) return <div>University not found</div>;

    // Fetch ALL upcoming published events
    const allUpcomingEvents = await prisma.event.findMany({
        where: {
            status: "PUBLISHED",
            endDateTime: { gte: new Date() }
        },
        orderBy: { startDateTime: 'asc' },
        include: {
            // Include city info if needed for dashboard listing, current UI needs city/country string
             cityRef: {
                 include: {
                     country: true
                 }
             }
        }
    });

    const totalLeads = await prisma.registration.count({
        where: {
            event: {
                universities: { some: { universityId } }
            }
        }
    });

    // Create a map of participation status
    const participationMap = new Map<string, string>();
    university.events.forEach(p => {
        participationMap.set(p.eventId, p.status);
    });

    // Combine all events with status
    const dashboardEvents = allUpcomingEvents.map(event => {
        return {
            event: {
                ...event,
                city: event.cityRef?.name || event.city || "Unknown", // Fallback to legacy string or cityRef
                country: event.cityRef?.country?.name || event.country || "Unknown" // We might need to fetch country name via cityRef relation if not eager loaded properly or just fallback
            },
            status: participationMap.get(event.id) || 'NONE'
        };
    });

    // Past events (only ones we participated in)
    const pastEvents = university.events.filter(e => new Date(e.event.endDateTime) < new Date());

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 tracking-tight">
                        Welcome, <span className="text-red-700">{university.name}</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl">
                        Your central command for event management and student recruitment.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white border-gray-200 shadow-sm text-gray-900 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-24 h-24 text-red-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">Available Events</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-display font-bold text-gray-900">{dashboardEvents.length}</div>
                        <p className="text-sm text-gray-400 mt-1">Upcoming this season</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-sm text-gray-900 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-24 h-24 rotate-12 text-gray-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">Past Events</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-display font-bold text-gray-900">{pastEvents.length}</div>
                        <p className="text-sm text-gray-400 mt-1">Successfully completed</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 shadow-sm text-gray-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-600/5 blur-xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-red-800 uppercase tracking-widest">Total Leads</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-display font-bold text-red-600">{totalLeads}</div>
                        <p className="text-sm text-red-800/60 mt-1">Total potential students</p>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Schedule */}
            <div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <span className="w-2 h-8 bg-red-600 rounded-full" />
                    All Events
                </h2>

                {dashboardEvents.length === 0 ? (
                    <Card className="p-12 text-center bg-white border-gray-200 border-dashed rounded-3xl">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No upcoming events</h3>
                        <p className="text-gray-500 mb-6">Check back later for new event announcements.</p>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {dashboardEvents.map(({ event, status }) => {
                            const isAccepted = status === 'ACCEPTED' || status === 'INVITED';
                            const isPending = status === 'REQUESTED';
                            
                            return (
                                <Card key={event.id} className="group bg-white border-gray-200 hover:border-red-200 hover:shadow-lg transition-all duration-300 text-gray-900 overflow-hidden rounded-3xl">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            {isAccepted ? (
                                                <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-emerald-600 border border-emerald-100 flex items-center gap-1 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> Participating
                                                </div>
                                            ) : isPending ? (
                                                <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-yellow-600 border border-yellow-100 flex items-center gap-1 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pending Approval
                                                </div>
                                            ) : (
                                                 <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-gray-500 border border-gray-200 flex items-center gap-1 shadow-sm">
                                                    Available
                                                </div>
                                            )}
                                        </div>
                                        <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-red-700 transition-colors">{event.title}</CardTitle>
                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center text-sm text-gray-600 gap-2">
                                                <Calendar className="h-4 w-4 text-red-500" />
                                                {format(new Date(event.startDateTime), "MMM d, yyyy")}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 gap-2">
                                                <MapPin className="h-4 w-4 text-red-500" />
                                                {event.city}, {event.country}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button 
                                            className={`w-full transition-all font-medium h-12 rounded-xl group/btn ${
                                                isAccepted 
                                                ? "bg-gray-50 hover:bg-red-600 hover:text-white text-gray-900 border border-gray-200" 
                                                : "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200"
                                            }`} 
                                            asChild
                                        >
                                            <Link href={`/university/events/${event.id}`}>
                                                {isAccepted ? 'Open Dashboard' : 'View Details & Join'}
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
