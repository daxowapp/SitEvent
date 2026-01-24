import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RedirectType, redirect } from "next/navigation";
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

    // Fetch university data and events
    const university = await prisma.university.findUnique({
        where: { id: universityId },
        include: {
            events: {
                // Show all assigned events (INVITED, PENDING, ACCEPTED) so they can accept them?
                // Or at least allow them to see what they are invited to.
                // Assuming dashboard should show confirmed and invites.
                include: {
                    event: true
                },
                orderBy: {
                    event: { startDateTime: 'asc' }
                },
                take: 10
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

    if (!university) return <div>University not found</div>;

    const upcomingEvents = university.events.filter(e => new Date(e.event.endDateTime) >= new Date());
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
                <Button asChild size="lg" className="rounded-full bg-red-600 text-white hover:bg-red-700 font-bold border border-transparent shadow-lg shadow-red-600/20">
                    <Link href="/university/explore">Find New Events</Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white border-gray-200 shadow-sm text-gray-900 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-24 h-24 text-red-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-display font-bold text-gray-900">{upcomingEvents.length}</div>
                        <p className="text-sm text-gray-400 mt-1">Scheduled for this season</p>
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
                    Upcoming Schedule
                </h2>

                {upcomingEvents.length === 0 ? (
                    <Card className="p-12 text-center bg-white border-gray-200 border-dashed rounded-3xl">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No upcoming events</h3>
                        <p className="text-gray-500 mb-6">You haven't confirmed attendance for any upcoming events.</p>
                        <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50" asChild>
                            <Link href="/university/explore">Browse Available Events</Link>
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingEvents.map(({ event, status }) => (
                            <Card key={event.id} className="group bg-white border-gray-200 hover:border-red-200 hover:shadow-lg transition-all duration-300 text-gray-900 overflow-hidden rounded-3xl">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${status === 'ACCEPTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                            status === 'INVITED' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                                'bg-white text-gray-400 border-gray-100'
                                            }`}>
                                            {status}
                                        </div>
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
                                    <Button className="w-full bg-gray-50 hover:bg-red-600 hover:text-white text-gray-900 border border-gray-200 transition-all font-medium h-12 rounded-xl group/btn" asChild>
                                        <Link href={`/university/events/${event.id}`}>
                                            {status === 'ACCEPTED' ? 'Open Dashboard' : 'View Details'}
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
