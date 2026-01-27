"use client"

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// --- Growth Chart ---
interface GrowthChartProps {
    data: { date: string; count: number }[]
}

export function GrowthChart({ data }: GrowthChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <Tooltip
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Date
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                                {label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Registrations
                                            </span>
                                            <span className="font-bold">
                                                {payload[0].value}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// --- Sources Chart ---
interface SourceData {
    name: string
    value: number
    [key: string]: string | number
}

interface SourcesChartProps {
    data: SourceData[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function SourcesChart({ data }: SourcesChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}

// --- Overview Stats ---
interface OverviewStatsProps {
    totalRegistrations: number;
    checkInCount: number;
    conversionRate: number;
    topSource: string;
}

export function OverviewStats({ totalRegistrations, checkInCount, conversionRate, topSource }: OverviewStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalRegistrations}</div>
                    <p className="text-xs text-muted-foreground">
                        All time
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{checkInCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Attendees present
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                        Registration to Check-in
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Source</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold capitalize">{topSource || "N/A"}</div>
                    <p className="text-xs text-muted-foreground">
                        Most popular channel
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
