import { Suspense } from "react";
import { getAnalyticsData, DateRange } from "./actions";
import { KPIStats } from "@/components/admin/analytics/kpi-cards";
import { AnalyticsCharts } from "@/components/admin/analytics/analytics-charts";
import { EventsPerformance } from "@/components/admin/analytics/events-performance";
import { DateRangeFilter } from "@/components/admin/analytics/date-range-filter";
import { Loader2 } from "lucide-react";
import { requireManagerOrAbove } from "@/lib/role-check";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage(props: { searchParams: Promise<{ range?: string }> }) {
    await requireManagerOrAbove();
    
    // Await searchParams in Next.js 15+
    const params = await props.searchParams;
    const range = (params.range as DateRange) || "7d";
    
    const data = await getAnalyticsData(range);

    const rangeLabel = {
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        '90d': 'Last 90 Days',
        '1y': 'Last Year',
        'all': 'All Time'
    }[range];

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-['Outfit'] text-slate-900 tracking-tight">
                        Analytics Overview
                    </h1>
                    <p className="text-slate-500 mt-2 font-['Outfit']">
                        Deep dive into platform performance and user engagement
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">Time Range:</span>
                    <DateRangeFilter />
                </div>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center p-12 h-[400px]">
                     <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            }>
                <KPIStats data={data.kpis} dateLabel={rangeLabel} />
                <AnalyticsCharts data={data.charts} />
                <EventsPerformance data={data.charts.eventsPerformance} />
            </Suspense>
        </div>
    );
}
