"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

interface AnalyticsChartsProps {
    leadsOverTime: { date: string; count: number }[];
    topMajors: { name: string; count: number }[];
    studyLevels: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    genders: { name: string; count: number }[];
}

export function AnalyticsCharts({ leadsOverTime, topMajors, studyLevels, categories, genders }: AnalyticsChartsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Leads Over Time */}
            <Card className="col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle>Leads Growth</CardTitle>
                    <CardDescription>Daily registration trends</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={leadsOverTime}>
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
                                    tickFormatter={(value: number) => `${value}`}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#e11d48" radius={[4, 4, 0, 0]} name="Students" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Gender Distribution (New) */}
            <Card className="col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle>Gender Distribution</CardTitle>
                    <CardDescription>Demographic breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={genders}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                    paddingAngle={5}
                                >
                                    {genders.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? '#3b82f6' : entry.name === 'Female' ? '#ec4899' : '#9ca3af'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Top Majors */}
            <Card className="col-span-2 md:col-span-1">
                <CardHeader>
                    <CardTitle>Top Interested Majors</CardTitle>
                    <CardDescription>Most popular fields of study</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topMajors} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    stroke="#888888" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={100}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} name="Students" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Major Categories (New) */}
            <Card className="col-span-2 md:col-span-1">
                <CardHeader>
                    <CardTitle>Interest Categories</CardTitle>
                    <CardDescription>Broad areas of interest</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={categories} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    stroke="#888888" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={100}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} name="Students" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Study Levels */}
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Level of Study Distribution</CardTitle>
                    <CardDescription>Breakdown by current academic level</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={studyLevels}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${(percent ? (percent * 100).toFixed(0) : '0')}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {studyLevels.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
