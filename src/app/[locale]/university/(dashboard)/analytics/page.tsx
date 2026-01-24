import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { BarChart3 } from "lucide-react";

export default async function UniversityAnalyticsPage() {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    const universityId = session.user.universityId;

    // Fetch All Leads to Aggregate
    const leads = await prisma.registration.findMany({
        where: {
            event: {
                universities: { some: { universityId } }
            }
        },
        include: {
            registrant: true,
            event: { select: { title: true } }
        }
    });

    // Fetch Event Count (Participating)
    const participatingEventsCount = await prisma.eventParticipating.count({
        where: { universityId }
    });

    // Aggregate Data
    const totalLeads = leads.length;
    const avgLeads = participatingEventsCount > 0 ? Math.round(leads.length / participatingEventsCount) : 0;

    // Leads by Event
    const leadsByEventMap = new Map<string, number>();
    leads.forEach(lead => {
        const title = lead.event.title;
        leadsByEventMap.set(title, (leadsByEventMap.get(title) || 0) + 1);
    });
    const leadsByEvent = Array.from(leadsByEventMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    // Top Majors
    const majorsMap = new Map<string, number>();
    leads.forEach(lead => {
        const major = lead.registrant.interestedMajor || "Undecided";
        majorsMap.set(major, (majorsMap.get(major) || 0) + 1);
    });
    const topMajors = Array.from(majorsMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Top Cities
    const citiesMap = new Map<string, number>();
    leads.forEach(lead => {
        const city = lead.registrant.city || "Unknown";
        citiesMap.set(city, (citiesMap.get(city) || 0) + 1);
    });
    const topCities = Array.from(citiesMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const analyticsData = {
        totalLeads,
        totalEvents: participatingEventsCount,
        avgLeads,
        leadsByEvent,
        topMajors,
        topCities
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold font-display text-gray-900 tracking-tight">Analytics & Insights</h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Live performance data across all your events.
                    </p>
                </div>
            </div>

            <AnalyticsDashboard data={analyticsData} />
        </div>
    );
}
