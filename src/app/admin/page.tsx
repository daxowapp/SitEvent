import Link from "next/link";
import { getDashboardData } from "./dashboard/actions";
import { StatCard } from "@/components/admin/dashboard/stat-card";
import { GeoMap } from "@/components/admin/dashboard/geo-map";
import { ActivityTimeline } from "@/components/admin/dashboard/activity-timeline";
import { RegistrationChart, EventStatusChart } from "@/components/admin/dashboard/overview-charts";
import { Plus, Scan, BarChart3, Settings } from "lucide-react";
import { requireManagerOrAbove } from "@/lib/role-check";

export default async function AdminDashboardPage() {
    await requireManagerOrAbove();
    const data = await getDashboardData();
    const { stats, trendData, statusCounts, recentActivity, actionOverview, geoData } = data;

    // Time-based greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-['Outfit'] text-slate-900">
                        {greeting}
                    </h1>
                    <p className="text-slate-500 mt-2 font-['Outfit']">
                        Here's what's happening across your events today
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/scan"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 font-['Outfit'] shadow-sm"
                    >
                        <Scan className="w-4 h-4" />
                        Scanner
                    </Link>
                    <Link
                        href="/admin/events/new"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all duration-300 shadow-md shadow-violet-200 font-['Outfit']"
                    >
                        <Plus className="w-4 h-4" />
                        Create Event
                    </Link>
                </div>
            </div>

            {/* Stats Grid - Bento Layout */}
            <div className="grid grid-cols-12 gap-6 mb-6">
                {/* Primary Stat - Large */}
                <div className="col-span-12 md:col-span-4">
                    <StatCard
                        title="Total Registrations"
                        value={stats.totalRegistrations}
                        subtitle="Lifetime attendees"
                        iconName="Users"
                        variant="primary"
                        size="large"
                    />
                </div>

                {/* Secondary Stats */}
                <div className="col-span-6 md:col-span-4">
                    <StatCard
                        title="Active Events"
                        value={stats.activeEvents}
                        subtitle="Currently published"
                        iconName="Calendar"
                        variant="accent"
                    />
                </div>

                <div className="col-span-6 md:col-span-4">
                    <StatCard
                        title="Total Events"
                        value={stats.totalEvents}
                        subtitle="Since platform launch"
                        iconName="TrendingUp"
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6 mb-6">
                {/* Map - Takes 2/3 */}
                <div className="col-span-12 lg:col-span-8 h-[500px]">
                    <GeoMap data={geoData} />
                </div>

                {/* Activity Timeline - Takes 1/3 */}
                <div className="col-span-12 lg:col-span-4 h-[500px]">
                    <ActivityTimeline
                        activities={recentActivity}
                        overview={actionOverview}
                    />
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-12 gap-6">
                {/* Registration Trends */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 font-['Outfit'] flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-violet-600" />
                                    Registration Trends
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Daily registrations over the last 30 days</p>
                            </div>
                        </div>
                        <RegistrationChart data={trendData.map(d => ({ date: d.date, value: d.count }))} />
                    </div>
                </div>

                {/* Event Status */}
                <div className="col-span-12 lg:col-span-4">
                    <div className="rounded-2xl bg-white border border-slate-200 p-6 h-full shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 font-['Outfit'] flex items-center gap-2 mb-6">
                            <Settings className="w-5 h-5 text-cyan-600" />
                            Event Status
                        </h3>
                        <EventStatusChart data={statusCounts} />
                    </div>
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                    href="/admin/registrations"
                    className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300 font-['Outfit'] text-sm shadow-sm"
                >
                    View All Registrations
                </Link>
                <Link
                    href="/admin/events"
                    className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300 font-['Outfit'] text-sm shadow-sm"
                >
                    Manage Events
                </Link>
                <Link
                    href="/admin/users"
                    className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300 font-['Outfit'] text-sm shadow-sm"
                >
                    Admin Users
                </Link>
            </div>
        </div>
    );
}
