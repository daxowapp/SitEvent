import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/university/analytics-client";

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
    
    const totalLeads = acceptedEvents.reduce((acc, participation) => {
        return acc + (participation.event.registrations?.length || 0);
    }, 0);

    const averageLeadsPerEvent = acceptedEvents.length > 0 ? Math.round(totalLeads / acceptedEvents.length) : 0;

    // Aggregate Data for Charts
    const allRegistrations = acceptedEvents.flatMap(p => p.event.registrations);

    // Leads Over Time (Daily)
    const leadsByDate = allRegistrations.reduce((acc, reg) => {
        const date = reg.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const leadsOverTime = Object.entries(leadsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Top Majors - Use standardizedMajor (AI-generated) for cleaner data
    const majorsCount = allRegistrations.reduce((acc, reg) => {
        const major = reg.registrant.standardizedMajor || reg.registrant.interestedMajor || "Unknown";
        acc[major] = (acc[major] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topMajors = Object.entries(majorsCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // Major Categories - Use AI-categorized majorCategory field
    const categoryCount = allRegistrations.reduce((acc, reg) => {
        const cat = reg.registrant.majorCategory || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categories = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // Gender Distribution
    const genderCount = allRegistrations.reduce((acc, reg) => {
        const gender = reg.registrant.gender || "Unknown";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const genders = Object.entries(genderCount)
        .map(([name, count]) => ({ name, count }));

    // Level of Study
    const studyLevelCount = allRegistrations.reduce((acc, reg) => {
        const level = reg.registrant.levelOfStudy || "Not Specified";
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const studyLevels = Object.entries(studyLevelCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // Recent Events
    const recentEvents = acceptedEvents
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(p => ({
            id: p.id,
            title: p.event.title,
            createdAt: p.createdAt,
            leadsCount: p.event.registrations?.length || 0
        }));

    return (
        <AnalyticsClient 
            totalLeads={totalLeads}
            averageLeadsPerEvent={averageLeadsPerEvent}
            acceptedEventsCount={acceptedEvents.length}
            pendingEventsCount={pendingEvents.length}
            leadsOverTime={leadsOverTime}
            topMajors={topMajors}
            studyLevels={studyLevels}
            categories={categories}
            genders={genders}
            recentEvents={recentEvents}
        />
    );
}
