"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Calendar, TrendingUp, MapPin } from "lucide-react";

interface AnalyticsData {
    totalLeads: number;
    totalEvents: number;
    avgLeads: number;
    leadsByEvent: { name: string; value: number }[];
    topMajors: { name: string; value: number }[];
    topCities: { name: string; value: number }[];
}

// Client Component for Charts (wrapper)
function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
    const COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fee2e2']; // Red scales

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-red-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{data.totalLeads}</div>
                        <p className="text-xs text-red-600 font-medium">+100% from start</p>
                    </CardContent>
                </Card>
                <Card className="border-red-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Active Events</CardTitle>
                        <Calendar className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{data.totalEvents}</div>
                        <p className="text-xs text-gray-400">Assigned & Participating</p>
                    </CardContent>
                </Card>
                <Card className="border-red-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Avg. Per Event</CardTitle>
                        <TrendingUp className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{data.avgLeads}</div>
                        <p className="text-xs text-gray-400">Students per event</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Leads by Event</CardTitle>
                        <CardDescription>Performance across your schedule</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.leadsByEvent}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    cursor={{ fill: '#fee2e2' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Top Majors</CardTitle>
                        <CardDescription>Student interest breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.topMajors}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.topMajors.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {data.topMajors.slice(0, 5).map((major, i) => (
                                <div key={i} className="flex items-center gap-1 text-xs text-gray-500">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    {major.name}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Server Component (Load Data)
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"; // Wait, using custom auth/db
// Assuming standard Next.js server component pattern with async data fetching
// But I need to define the page component in the same file to keep it simple or separate.
// I will separate logic. The user requested `page.tsx`.
// I'll make this file export default async function Page() and put Client component inside or same file.
// Since Recharts must be client-side, I'll default export the async Page which fetches data and renders the client component.

export { AnalyticsDashboard };
