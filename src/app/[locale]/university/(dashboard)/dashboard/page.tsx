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
                where: { status: "ACCEPTED" }, // Only show accepted events in main dashboard
                include: {
                    event: true
                },
                orderBy: {
                    event: { startDateTime: 'asc' }
                },
                take: 5
            }
        }
    });

    if (!university) return <div>University not found</div>;

    const upcomingEvents = university.events.filter(e => new Date(e.event.endDateTime) >= new Date());
    const pastEvents = university.events.filter(e => new Date(e.event.endDateTime) < new Date());

    return (
        <div className="space-y-10">
            {/* Header with Gradient Text */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                        Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{university.name}</span>
                    </h1>
                    <p className="text-lg text-white/50 max-w-2xl">
                        Your central command for event management and student recruitment.
                    </p>
                </div>
                <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-emerald-400 hover:text-black font-bold border border-transparent hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Link href="/university/explore">Find New Events</Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white/5 border-white/10 backdrop-blur-md text-white hover:bg-white/10 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-widest">Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-display font-bold">{upcomingEvents.length}</div>
                        <p className="text-sm text-white/40 mt-1">Scheduled for this season</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md text-white hover:bg-white/10 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-24 h-24 rotate-12" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-widest">Past Events</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-display font-bold">{pastEvents.length}</div>
                        <p className="text-sm text-white/40 mt-1">Successfully completed</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 backdrop-blur-md text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-emerald-300 uppercase tracking-widest">Total Leads</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-display font-bold text-emerald-400">---</div>
                        <p className="text-sm text-emerald-200/50 mt-1">Students scanned</p>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Schedule */}
            <div>
                <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                    <span className="w-2 h-8 bg-emerald-500 rounded-full" />
                    Upcoming Schedule
                </h2>

                {upcomingEvents.length === 0 ? (
                    <Card className="p-12 text-center bg-white/5 border-white/10 border-dashed rounded-3xl">
                        <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No upcoming events</h3>
                        <p className="text-white/50 mb-6">You haven't registered for any events yet.</p>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                            <Link href="/university/explore">Browse Available Events</Link>
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingEvents.map(({ event }) => (
                            <Card key={event.id} className="group bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300 text-white overflow-hidden rounded-3xl">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                                            Confirmed
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-emerald-400 transition-colors">{event.title}</CardTitle>
                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center text-sm text-white/60 gap-2">
                                            <Calendar className="h-4 w-4 text-emerald-500" />
                                            {format(new Date(event.startDateTime), "MMM d, yyyy")}
                                        </div>
                                        <div className="flex items-center text-sm text-white/60 gap-2">
                                            <MapPin className="h-4 w-4 text-emerald-500" />
                                            {event.city}, {event.country}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full bg-white/10 hover:bg-emerald-500 hover:text-black text-white border border-white/5 transition-all font-medium h-12 rounded-xl" asChild>
                                        <Link href={`/university/events/${event.id}`}>
                                            Open Event Hub <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
