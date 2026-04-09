"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OverviewStats, GrowthChart, SourcesChart, GenderChart, HorizontalBarChart } from "./charts"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getRealtimeAnalytics } from "@/app/actions/analytics"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface AnalyticsDashboardProps {
    eventId: string;
    data: {
        totalRegistrations: number;
        checkInCount: number;
        dailyGrowth: { date: string; count: number }[];
        sources: { name: string; value: number }[];
        topSource: string;
        genders?: { name: string; count: number }[];
        topMajors?: { name: string; count: number }[];
        categories?: { name: string; count: number }[];
    }
}

export function AnalyticsDashboard({ eventId, data: initialData }: AnalyticsDashboardProps) {
    const [isLive, setIsLive] = useState(false);
    const [stats, setStats] = useState({
        totalRegistrations: initialData.totalRegistrations,
        checkInCount: initialData.checkInCount
    });
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const conversionRate = stats.totalRegistrations > 0
        ? (stats.checkInCount / stats.totalRegistrations) * 100
        : 0;

    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(async () => {
            try {
                setIsRefreshing(true);
                const newData = await getRealtimeAnalytics(eventId);
                setStats(newData);
                setLastUpdated(new Date());
            } catch (error) {
                console.error("Failed to fetch realtime data", error);
                toast.error("Failed to update realtime data");
                setIsLive(false); // Stop if error
            } finally {
                setIsRefreshing(false);
            }
        }, 15000); // 15 seconds

        return () => clearInterval(interval);
    }, [isLive, eventId]);

    // Initial load confirmation or manual refresh handler could be added here

    return (
        <div className="space-y-8">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="live-mode" checked={isLive} onCheckedChange={setIsLive} />
                        <Label htmlFor="live-mode" className="font-medium">Live Mode</Label>
                    </div>
                    {isLive && (
                        <Badge variant="outline" className="animate-pulse border-green-500 text-green-600 bg-green-50 gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Updates
                        </Badge>
                    )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isRefreshing && <RefreshCw className="h-3 w-3 animate-spin" />}
                    {lastUpdated ? (
                        <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
                    ) : (
                        <span>Updates every 15s</span>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <OverviewStats
                totalRegistrations={stats.totalRegistrations}
                checkInCount={stats.checkInCount}
                conversionRate={conversionRate}
                topSource={initialData.topSource}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Growth Chart - Takes up 4 columns */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Registration Growth</CardTitle>
                        <CardDescription>
                            Daily registrations over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <GrowthChart data={initialData.dailyGrowth} />
                    </CardContent>
                </Card>

                {/* Sources Chart - Takes up 3 columns */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Traffic Sources</CardTitle>
                        <CardDescription>
                            Distribution by Marketing Channel (UTM)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SourcesChart data={initialData.sources} />
                    </CardContent>
                </Card>
            </div>
            
            {(initialData.genders || initialData.categories || initialData.topMajors) && (
                <>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {/* Gender Chart */}
                         {initialData.genders && (
                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>Gender Distribution</CardTitle>
                                    <CardDescription>Demographic breakdown</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <GenderChart data={initialData.genders} />
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Majors Chart */}
                        {initialData.topMajors && (
                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>Top Majors</CardTitle>
                                    <CardDescription>Most popular standardized majors</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <HorizontalBarChart data={initialData.topMajors} color="#8884d8" />
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Categories Chart */}
                         {initialData.categories && (
                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>Interest Categories</CardTitle>
                                    <CardDescription>Broad areas of interest</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <HorizontalBarChart data={initialData.categories} color="#82ca9d" />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
