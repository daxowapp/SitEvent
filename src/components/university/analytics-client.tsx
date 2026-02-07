"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, TrendingUp, CalendarCheck, Clock, Sparkles, BarChart3, PieChartIcon } from "lucide-react";
import { AnimatedNumber, StaggerContainer, StaggerItem, AnimatedCard } from "@/components/ui/motion";

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// Animation variants - using const assertions for proper TypeScript compatibility
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 24
        }
    }
};

interface AnalyticsClientProps {
    totalLeads: number;
    averageLeadsPerEvent: number;
    acceptedEventsCount: number;
    pendingEventsCount: number;
    leadsOverTime: { date: string; count: number }[];
    topMajors: { name: string; count: number }[];
    studyLevels: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    genders: { name: string; count: number }[];
    recentEvents: { id: string; title: string; createdAt: Date; leadsCount: number }[];
}

export function AnalyticsClient({
    totalLeads,
    averageLeadsPerEvent,
    acceptedEventsCount,
    pendingEventsCount,
    leadsOverTime,
    // topMajors removed - using categories instead which are AI-categorized
    studyLevels,
    categories,
    genders,
    recentEvents,
}: AnalyticsClientProps) {
    return (
        <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-2">
                    <motion.div
                        className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-200"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <BarChart3 className="h-5 w-5 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-display font-bold tracking-tight">Analytics Overview</h1>
                </div>
                <p className="text-gray-500">Insights into your recruitment performance across all events.</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                variants={containerVariants}
            >
                {/* Total Leads */}
                <motion.div variants={itemVariants}>
                    <AnimatedCard hoverScale={1.03} hoverY={-6}>
                        <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-200">
                            <motion.div 
                                className="absolute -right-4 -top-4 opacity-20"
                                animate={{ rotate: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <Users className="h-24 w-24" />
                            </motion.div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-white/80">Total Student Leads</CardTitle>
                                <Users className="h-4 w-4 text-white/60" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    <AnimatedNumber value={totalLeads} duration={1.5} />
                                </div>
                                <p className="text-xs text-white/60 mt-1">Across {acceptedEventsCount} events</p>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                </motion.div>

                {/* Avg Leads */}
                <motion.div variants={itemVariants}>
                    <AnimatedCard hoverScale={1.03} hoverY={-6}>
                        <Card className="relative overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm hover:shadow-xl transition-shadow">
                            <motion.div 
                                className="absolute -right-4 -top-4 opacity-5"
                                animate={{ rotate: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                            >
                                <TrendingUp className="h-24 w-24 text-blue-500" />
                            </motion.div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Avg. Leads / Event</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">
                                    <AnimatedNumber value={averageLeadsPerEvent} duration={1.2} />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Performance metric</p>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                </motion.div>

                {/* Active Events */}
                <motion.div variants={itemVariants}>
                    <AnimatedCard hoverScale={1.03} hoverY={-6}>
                        <Card className="relative overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm hover:shadow-xl transition-shadow">
                            <motion.div 
                                className="absolute -right-4 -top-4 opacity-5"
                                animate={{ rotate: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                            >
                                <CalendarCheck className="h-24 w-24 text-emerald-500" />
                            </motion.div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Active Events</CardTitle>
                                <CalendarCheck className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">
                                    <AnimatedNumber value={acceptedEventsCount} duration={1} />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Participating now</p>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                </motion.div>

                {/* Pending */}
                <motion.div variants={itemVariants}>
                    <AnimatedCard hoverScale={1.03} hoverY={-6}>
                        <Card className="relative overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm hover:shadow-xl transition-shadow">
                            <motion.div 
                                className="absolute -right-4 -top-4 opacity-5"
                                animate={{ rotate: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                            >
                                <Clock className="h-24 w-24 text-amber-500" />
                            </motion.div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Pending Requests</CardTitle>
                                <Clock className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">
                                    <AnimatedNumber value={pendingEventsCount} duration={0.8} />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                </motion.div>
            </motion.div>

            {/* Charts Grid */}
            <motion.div 
                className="grid gap-6 md:grid-cols-2"
                variants={containerVariants}
            >
                {/* Leads Over Time */}
                <motion.div variants={itemVariants} className="col-span-2 lg:col-span-1">
                    <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-red-100">
                                    <BarChart3 className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Leads Growth</CardTitle>
                                    <CardDescription>Daily registration trends</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={leadsOverTime}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" />
                                                <stop offset="100%" stopColor="#f97316" />
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#9ca3af" 
                                            fontSize={11} 
                                            tickLine={false} 
                                            axisLine={false}
                                            tickFormatter={(value) => value.split('-').slice(1).join('/')}
                                        />
                                        <YAxis 
                                            stroke="#9ca3af" 
                                            fontSize={11} 
                                            tickLine={false} 
                                            axisLine={false} 
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }}
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                                                padding: '12px 16px'
                                            }}
                                        />
                                        <Bar 
                                            dataKey="count" 
                                            fill="url(#barGradient)" 
                                            radius={[6, 6, 0, 0]} 
                                            name="Students"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Gender Distribution */}
                <motion.div variants={itemVariants} className="col-span-2 lg:col-span-1">
                    <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-purple-100">
                                    <PieChartIcon className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Gender Distribution</CardTitle>
                                    <CardDescription>Demographic breakdown</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={genders}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            fill="#8884d8"
                                            dataKey="count"
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            {genders.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.name === 'Male' ? '#3b82f6' : entry.name === 'Female' ? '#ec4899' : '#9ca3af'} 
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Major Categories - Using AI-categorized data */}
                <motion.div variants={itemVariants} className="col-span-2 md:col-span-1">
                    <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden h-full">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-100">
                                    <Sparkles className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Major Categories</CardTitle>
                                    <CardDescription>AI-categorized fields of study</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categories} layout="vertical" margin={{ left: 10 }}>
                                        <defs>
                                            <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#22c55e" />
                                                <stop offset="100%" stopColor="#4ade80" />
                                            </linearGradient>
                                        </defs>
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            stroke="#9ca3af" 
                                            fontSize={11} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            width={100}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(34, 197, 94, 0.05)' }}
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                                            }}
                                        />
                                        <Bar 
                                            dataKey="count" 
                                            fill="url(#greenGradient)" 
                                            radius={[0, 6, 6, 0]} 
                                            name="Students" 
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Study Levels */}
                <motion.div variants={itemVariants} className="col-span-2 md:col-span-1">
                    <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden h-full">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-100">
                                    <PieChartIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Study Levels</CardTitle>
                                    <CardDescription>Academic level distribution</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={studyLevels}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }: { name?: string; percent?: number }) => 
                                                `${name || ''} ${(percent ? (percent * 100).toFixed(0) : '0')}%`
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="count"
                                            stroke="none"
                                        >
                                            {studyLevels.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-50">
                        <CardTitle className="text-lg">Recent Event Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <StaggerContainer className="space-y-4">
                            {recentEvents.length === 0 ? (
                                <p className="text-sm text-gray-500">No recent activity.</p>
                            ) : (
                                recentEvents.map((event, index) => (
                                    <StaggerItem key={event.id}>
                                        <motion.div 
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                            whileHover={{ x: 4 }}
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">{event.title}</p>
                                                <p className="text-sm text-gray-500">
                                                    Joined on {new Date(event.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <motion.div 
                                                className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm"
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2 + index * 0.1 }}
                                            >
                                                +{event.leadsCount} Leads
                                            </motion.div>
                                        </motion.div>
                                    </StaggerItem>
                                ))
                            )}
                        </StaggerContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
