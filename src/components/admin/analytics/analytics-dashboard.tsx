"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OverviewStats, GrowthChart, SourcesChart } from "./charts"
import { Separator } from "@/components/ui/separator"

interface AnalyticsDashboardProps {
    data: {
        totalRegistrations: number;
        checkInCount: number;
        dailyGrowth: { date: string; count: number }[];
        sources: { name: string; value: number }[];
        topSource: string;
    }
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
    const conversionRate = data.totalRegistrations > 0
        ? (data.checkInCount / data.totalRegistrations) * 100
        : 0;

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <OverviewStats
                totalRegistrations={data.totalRegistrations}
                checkInCount={data.checkInCount}
                conversionRate={conversionRate}
                topSource={data.topSource}
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
                        <GrowthChart data={data.dailyGrowth} />
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
                        <SourcesChart data={data.sources} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
