import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, Clock, TrendingUp } from "lucide-react";
import { AnalyticsCharts } from "@/components/university/analytics-charts";
import { EventChatbot } from "@/components/university/event-chatbot";

export default async function UniversityAnalyticsPage() {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    const universityId = session.user.universityId;

    // Fetch University Data with Events and Registrations
    const university = await prisma.university.findUnique({
        where: { id: universityId },
        include: {
            events: {
                include: {
                    event: {
                        include: {
                            registrations: {
                                include: { registrant: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!university) return <div>University not found</div>;

    // Calculate Stats
    const acceptedEvents = university.events.filter(e => e.status === "ACCEPTED" || e.status === "INVITED");
    const pendingEvents = university.events.filter(e => e.status === "REQUESTED");
    
    // Total Leads calculation: Sum of registrations for all ACCEPTED events
    // NOTE: In this model, if an event has 100 students, and this university participates, do they see all 100? Yes, per previous logic.
    const totalLeads = acceptedEvents.reduce((acc, participation) => {
        return acc + (participation.event.registrations?.length || 0);
    }, 0);

    const averageLeadsPerEvent = acceptedEvents.length > 0 ? Math.round(totalLeads / acceptedEvents.length) : 0;

    // Aggregate Data for Charts
    const allRegistrations = acceptedEvents.flatMap(p => p.event.registrations);

    // 1. Leads Over Time (Daily)
    const leadsByDate = allRegistrations.reduce((acc, reg) => {
        const date = reg.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const leadsOverTime = Object.entries(leadsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Top Majors
    const majorsCount = allRegistrations.reduce((acc, reg) => {
        const major = reg.registrant.standardizedMajor || reg.registrant.interestedMajor || "Unknown";
        acc[major] = (acc[major] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topMajors = Object.entries(majorsCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Top 8

    // 2.5 Major Categories
    const categoryCount = allRegistrations.reduce((acc, reg) => {
        const cat = reg.registrant.majorCategory || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categories = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // 2.6 Gender Distribution
    const genderCount = allRegistrations.reduce((acc, reg) => {
        const gender = reg.registrant.gender || "Unknown";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const genders = Object.entries(genderCount)
        .map(([name, count]) => ({ name, count }));

    // 3. Level of Study
    const studyLevelCount = allRegistrations.reduce((acc, reg) => {
        const level = reg.registrant.levelOfStudy || "Not Specified";
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const studyLevels = Object.entries(studyLevelCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
            <p className="text-gray-500">Insights into your recruitment performance across all events.</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Student Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLeads}</div>
                        <p className="text-xs text-muted-foreground">Across {acceptedEvents.length} events</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Leads / Event</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageLeadsPerEvent}</div>
                        <p className="text-xs text-muted-foreground">Performance metric</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{acceptedEvents.length}</div>
                        <p className="text-xs text-muted-foreground">Participating now</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingEvents.length}</div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <AnalyticsCharts 
                leadsOverTime={leadsOverTime}
                topMajors={topMajors}
                studyLevels={studyLevels}
                categories={categories}
                genders={genders}
            />

            {/* Recent Activity Table */}
            <div className="grid gap-4 grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Event Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                             {acceptedEvents.length === 0 ? (
                                <p className="text-sm text-gray-500">No recent activity.</p>
                             ) : (
                                acceptedEvents
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .slice(0, 5)
                                    .map(p => (
                                    <div key={p.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="font-medium leading-none">{p.event.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Joined on {new Date(p.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="font-medium text-emerald-600">
                                            +{p.event.registrations?.length || 0} Leads
                                        </div>
                                    </div>
                                ))
                             )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Chatbot - Connected to the most recent event for demo context */}
            <EventChatbot eventId={acceptedEvents[0]?.eventId} />
        </div>
    );
}

