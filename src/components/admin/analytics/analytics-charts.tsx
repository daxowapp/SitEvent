"use client";

import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsData } from "@/app/admin/analytics/actions";

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#64748b'];

interface AnalyticsChartsProps {
    data: AnalyticsData['charts'];
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
            
            {/* Main Trend Chart - spans full width on md, 4 cols on lg */}
            <Card className="col-span-full lg:col-span-4">
                <CardHeader>
                    <CardTitle>Registration Growth</CardTitle>
                    <CardDescription>
                        User registration trends over the selected period.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={data.registrationTrend}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
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
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#888888" 
                                fillOpacity={1} 
                                fill="url(#colorCount)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top Majors - 3 cols */}
            <Card className="col-span-full lg:col-span-3">
                <CardHeader>
                    <CardTitle>Top Majors</CardTitle>
                    <CardDescription>
                        Most popular fields of study among registrants.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data.topMajors} layout="vertical" margin={{ left: 0 }}>
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
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Categories & Gender - Split 3/4 or 2/2 */}
            <Card className="col-span-full md:col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Interest Categories</CardTitle>
                    <CardDescription>Distribution by major category.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data.categories}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.categories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-full md:col-span-1 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Top countries by registrant count.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.geoDistribution}>
                            <XAxis 
                                dataKey="country" 
                                stroke="#888888" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{fill: 'transparent'}}
                            />
                            <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-full lg:col-span-3">
                <CardHeader>
                    <CardTitle>Traffic Sources</CardTitle>
                    <CardDescription>Where are registrations coming from?</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie
                                data={data.trafficSources}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.trafficSources.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
