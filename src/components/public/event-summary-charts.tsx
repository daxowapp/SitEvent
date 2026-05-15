"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTranslations } from "next-intl";

interface EventSummaryChartsProps {
    countryData: { name: string; value: number }[];
    studyLevelData: { name: string; value: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export function EventSummaryCharts({ countryData, studyLevelData }: EventSummaryChartsProps) {
    const t = useTranslations('events');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Top Countries Chart */}
            <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-xl card-elevated">
                <h3 className="font-display text-2xl font-bold text-card-foreground mb-6">
                    {t.has('topCountries') ? t('topCountries') : "Top Attendee Countries"}
                </h3>
                {countryData.length > 0 ? (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={countryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {countryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-72 flex items-center justify-center text-muted-foreground">
                        No data available
                    </div>
                )}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {countryData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            {entry.name} ({entry.value})
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Study Levels Chart */}
            <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-xl card-elevated">
                <h3 className="font-display text-2xl font-bold text-card-foreground mb-6">
                    {t.has('studyLevels') ? t('studyLevels') : "Interest by Study Level"}
                </h3>
                {studyLevelData.length > 0 ? (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={studyLevelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                    {studyLevelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-72 flex items-center justify-center text-muted-foreground">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}
