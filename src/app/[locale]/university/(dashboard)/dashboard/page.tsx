import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/university/dashboard-client";

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
                id: event.id,
                title: event.title,
                startDateTime: event.startDateTime,
                city: event.cityRef?.name || event.city || "Unknown",
                country: event.cityRef?.country?.name || event.country || "Unknown"
            },
            status: participationMap.get(event.id) || 'NONE'
        };
    });

    // Past events (only ones we participated in)
    const pastEvents = university.events.filter(e => new Date(e.event.endDateTime) < new Date());

    return (
        <DashboardClient 
            universityName={university.name}
            totalLeads={totalLeads}
            dashboardEvents={dashboardEvents}
            pastEventsCount={pastEvents.length}
        />
    );
}
