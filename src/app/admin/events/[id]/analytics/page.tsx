"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, TrendingUp, Users, MapPin, GraduationCap, CheckCircle2 } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

// Dynamically import html2pdf to avoid SSR issues
const html2pdf = typeof window !== "undefined" ? require("html2pdf.js") : null;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [eventId]);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}/analytics`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to load analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        if (!reportRef.current || !html2pdf) return;
        setExporting(true);

        const element = reportRef.current;
        const opt = {
            margin: [10, 10],
            filename: `event-report-${data.event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            setExporting(false);
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center">Failed to load data</div>;

    const { event, stats, charts } = data;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header Actions */}
            <div className="flex justify-end mb-4">
                <Button onClick={handleExportPDF} disabled={exporting}>
                    {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export PDF
                </Button>
            </div>

            {/* Printable Report Area */}
            <div ref={reportRef} className="space-y-8 bg-white p-8 rounded-xl min-h-screen">

                {/* Report Header */}
                <div className="border-b pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Analytics Report generated on {new Date().toLocaleDateString()}</span>
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard
                        title="Total Registrations"
                        value={stats.registrations}
                        icon={<Users className="text-blue-500" />}
                        subtext={`${stats.capacityFill}% of capacity`}
                    />
                    <KpiCard
                        title="Checked In"
                        value={stats.checkIns}
                        icon={<CheckCircle2 className="text-green-500" />}
                        subtext="Attendees present"
                    />
                    <KpiCard
                        title="Conversion Rate"
                        value={`${stats.checkInRate}%`}
                        icon={<TrendingUp className="text-purple-500" />}
                        subtext="Reg to Check-in"
                    />
                    <KpiCard
                        title="Capacity"
                        value={event.capacity || "Unlimited"}
                        icon={<Users className="text-gray-400" />}
                        subtext="Total spots"
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                    {/* Registration Trend */}
                    <ChartCard title="Registration Trend (Last 30 Days)">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={charts.timeline}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Study Levels */}
                    <ChartCard title="Study Levels Distribution">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={charts.studyLevels}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {charts.studyLevels.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Top Cities */}
                    <ChartCard title="Top Cities">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.cities} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#00C49F" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Top Majors */}
                    <ChartCard title="Top Interested Majors">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.majors} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#FFBB28" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                </div>

                <div className="text-center text-sm text-gray-400 mt-12 pt-8 border-t">
                    Generated by Education Events Platform
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, subtext }: { title: string, value: string | number, icon: any, subtext: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{subtext}</p>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold leading-none tracking-tight mb-6">{title}</h3>
            {children}
        </div>
    );
}
