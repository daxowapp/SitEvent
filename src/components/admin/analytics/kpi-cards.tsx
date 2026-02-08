"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BarChart3, TrendingUp, TrendingDown, CheckCircle2, Percent } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    change: number;
    icon: React.ElementType;
    description: string;
}

function KPICard({ title, value, change, icon: Icon, description }: KPICardProps) {
    const isPositive = change >= 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    {change !== 0 && (
                         <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'} mr-1`}>
                            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(change)}%
                        </span>
                    )}
                    {change === 0 ? <span className="text-slate-400 mr-1">No change</span> : null}
                    <span className="opacity-80">from previous period</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">{description}</p>
            </CardContent>
        </Card>
    );
}

interface KPIStatsProps {
    data: {
        totalRegistrations: { value: number; change: number };
        totalEvents: { value: number; change: number };
        activeEvents: { value: number; change: number };
        conversionRate: { value: number; change: number }; 
        totalCheckIns: { value: number; change: number };
        attendanceRate: { value: number; change: number };
    };
    dateLabel: string;
}

export function KPIStats({ data, dateLabel }: KPIStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <KPICard
                title="Total Registrations"
                value={data.totalRegistrations.value}
                change={data.totalRegistrations.change}
                icon={Users}
                description={`Registrations in ${dateLabel}`}
            />
            <KPICard
                title="Total Check-ins"
                value={data.totalCheckIns.value}
                change={data.totalCheckIns.change}
                icon={CheckCircle2}
                description={`Check-ins in ${dateLabel}`}
            />
             <KPICard
                title="Attendance Rate"
                value={`${data.attendanceRate.value}%`}
                change={data.attendanceRate.change}
                icon={Percent}
                description="Check-ins vs Registrations"
            />
            <KPICard
                title="New Events"
                value={data.totalEvents.value}
                change={data.totalEvents.change}
                icon={Calendar}
                description="Events created in this period"
            />
            <KPICard
                title="Active Events"
                value={data.activeEvents.value}
                change={data.activeEvents.change}
                icon={BarChart3}
                description="Currently live and distinct events"
            />
             <KPICard
                title="Avg. Registrations"
                value={data.conversionRate.value}
                change={data.conversionRate.change}
                icon={TrendingUp}
                description="Average registrations per event"
            />
        </div>
    );
}
