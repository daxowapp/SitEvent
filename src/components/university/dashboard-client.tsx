"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Sparkles, TrendingUp, Zap, Target, Users, Globe } from "lucide-react";
import { format } from "date-fns";
import { AnimatedNumber, StaggerContainer, StaggerItem, AnimatedCard } from "@/components/ui/motion";
import { useTranslations } from "next-intl";

interface DashboardEvent {
    event: {
        id: string;
        title: string;
        startDateTime: Date;
        city: string;
        country: string;
    };
    status: string;
}

interface DashboardClientProps {
    universityName: string;
    totalLeads: number;
    dashboardEvents: DashboardEvent[];
    pastEventsCount: number;
}

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

const heroVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number]
        }
    }
};

// Floating particle component - uses deterministic values passed as props
const FloatingParticle = ({ delay = 0, size = 4, x = 0, y = 0, duration = 4 }: { delay?: number; size?: number; x?: number; y?: number; duration?: number }) => (
    <motion.div
        className="absolute rounded-full bg-gradient-to-br from-red-400 to-orange-400 opacity-20"
        style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
        animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
        }}
        transition={{
            duration: duration,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
    />
);

// Pre-computed particle positions for deterministic rendering
const PARTICLE_POSITIONS = [
    { x: 10, y: 15, size: 6, duration: 4.5 },
    { x: 25, y: 30, size: 8, duration: 5.2 },
    { x: 45, y: 10, size: 5, duration: 4.8 },
    { x: 70, y: 25, size: 7, duration: 5.5 },
    { x: 85, y: 40, size: 6, duration: 4.3 },
    { x: 15, y: 60, size: 9, duration: 5.0 },
    { x: 35, y: 75, size: 5, duration: 4.7 },
    { x: 55, y: 55, size: 7, duration: 5.3 },
    { x: 80, y: 70, size: 8, duration: 4.6 },
    { x: 5, y: 85, size: 6, duration: 5.1 },
    { x: 60, y: 90, size: 7, duration: 4.4 },
    { x: 90, y: 80, size: 5, duration: 5.4 },
    { x: 40, y: 45, size: 8, duration: 4.9 },
    { x: 20, y: 50, size: 6, duration: 5.6 },
    { x: 75, y: 15, size: 7, duration: 4.2 },
];

export function DashboardClient({ 
    universityName, 
    totalLeads, 
    dashboardEvents, 
    pastEventsCount 
}: DashboardClientProps) {
    const t = useTranslations('university.dashboard');

    return (
        <motion.div 
            className="space-y-10 relative"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Floating Particles Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {PARTICLE_POSITIONS.map((particle, i) => (
                    <FloatingParticle 
                        key={i} 
                        delay={i * 0.3} 
                        size={particle.size}
                        x={particle.x}
                        y={particle.y}
                        duration={particle.duration}
                    />
                ))}
            </div>

            {/* Hero Header with Gradient Mesh */}
            <motion.div 
                className="relative rounded-3xl overflow-hidden"
                variants={heroVariants}
            >
                {/* Gradient Mesh Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-purple-500/10 rounded-3xl" />
                <motion.div 
                    className="absolute inset-0 opacity-30"
                    animate={{
                        background: [
                            "radial-gradient(circle at 20% 20%, rgba(239,68,68,0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 80% 80%, rgba(239,68,68,0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 20% 20%, rgba(239,68,68,0.15) 0%, transparent 50%)"
                        ]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative px-8 py-10 md:py-14">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-4">
                            <motion.div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-red-100 shadow-lg shadow-red-100/50"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="h-4 w-4 text-red-500" />
                                </motion.div>
                                <span className="text-sm font-semibold text-red-700">{t('title')}</span>
                            </motion.div>
                            
                            <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 tracking-tight leading-tight">
                                {t('welcome')}
                                <br />
                                <motion.span 
                                    className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4, type: "spring" as const, stiffness: 200 }}
                                >
                                    {universityName}
                                </motion.span>
                            </h1>
                            
                            <motion.p 
                                className="text-lg text-gray-600 max-w-xl"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {t('subtitle')}
                            </motion.p>
                        </div>
                        
                        {/* Quick Stats Mini Cards */}
                        <motion.div 
                            className="grid grid-cols-2 gap-3 w-full md:w-auto"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="px-5 py-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-lg text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    <AnimatedNumber value={totalLeads} duration={2} />
                                </div>
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">{t('statLeads')}</div>
                            </div>
                            <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-200 text-center">
                                <div className="text-3xl font-bold">
                                    <AnimatedNumber value={dashboardEvents.length} duration={1.5} />
                                </div>
                                <div className="text-xs text-white/80 font-medium uppercase tracking-wider mt-1">{t('statEvents')}</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Main Stats Grid - Bento Style */}
            <motion.div 
                className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                variants={containerVariants}
            >
                {/* Available Events - Large Card */}
                <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <AnimatedCard className="h-full" hoverScale={1.03} hoverY={-8}>
                        <Card className="h-full bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl shadow-blue-200 text-white relative overflow-hidden rounded-2xl min-h-[180px]">
                            <motion.div 
                                className="absolute -right-6 -bottom-6 opacity-20"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                <Calendar className="w-32 h-32" />
                            </motion.div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t('availableEvents')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-5xl font-display font-bold">
                                    <AnimatedNumber value={dashboardEvents.length} duration={1.2} />
                                </div>
                                <p className="text-sm text-white/70 mt-2 flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4" />
                                    {t('upcomingSeason')}
                                </p>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                </motion.div>

                {/* Past Events */}
                <motion.div variants={itemVariants}>
                    <AnimatedCard className="h-full" hoverScale={1.03} hoverY={-8}>
                        <Card className="h-full bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow text-gray-900 relative overflow-hidden rounded-2xl min-h-[180px]">
                            <motion.div 
                                className="absolute -right-4 -top-4 opacity-5"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 6, repeat: Infinity }}
                            >
                                <Target className="w-24 h-24 text-gray-900" />
                            </motion.div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-emerald-500" />
                                    {t('completed')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-display font-bold text-gray-900">
                                    <AnimatedNumber value={pastEventsCount} duration={1} />
                                </div>
                                <p className="text-sm text-gray-400 mt-2">{t('pastEvents')}</p>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                </motion.div>

                {/* Total Leads - Highlighted */}
                <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <AnimatedCard className="h-full" hoverScale={1.04} hoverY={-10}>
                        <Card className="h-full bg-gradient-to-br from-red-500 via-red-600 to-orange-500 border-0 shadow-xl shadow-red-200 text-white relative overflow-hidden rounded-2xl min-h-[180px]">
                            <motion.div 
                                className="absolute inset-0"
                                animate={{ 
                                    background: [
                                        "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                                        "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                                        "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)"
                                    ]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                            <motion.div 
                                className="absolute -right-4 -bottom-4 opacity-20"
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Users className="w-28 h-28" />
                            </motion.div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Zap className="h-4 w-4 text-yellow-300" />
                                    </motion.div>
                                    {t('totalLeads')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-5xl font-display font-bold">
                                    <AnimatedNumber value={totalLeads} duration={1.5} />
                                </div>
                                <p className="text-sm text-white/80 mt-2">{t('potentialStudents')}</p>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                </motion.div>

                {/* Countries Reached */}
                <motion.div variants={itemVariants}>
                    <AnimatedCard className="h-full" hoverScale={1.03} hoverY={-8}>
                        <Card className="h-full bg-gradient-to-br from-emerald-500 to-teal-600 border-0 shadow-xl shadow-emerald-200 text-white relative overflow-hidden rounded-2xl min-h-[180px]">
                            <motion.div 
                                className="absolute -right-4 -top-4 opacity-20"
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            >
                                <Globe className="w-24 h-24" />
                            </motion.div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    {t('countries')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-display font-bold">
                                    <AnimatedNumber 
                                        value={new Set(dashboardEvents.map(e => e.event.country)).size} 
                                        duration={1.2} 
                                    />
                                </div>
                                <p className="text-sm text-white/80 mt-2">{t('globalReach')}</p>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                </motion.div>
            </motion.div>

            {/* Events Section */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <motion.span 
                            className="w-1.5 h-10 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"
                            initial={{ height: 0 }}
                            animate={{ height: 40 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                        />
                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900">{t('yourEvents')}</h2>
                            <p className="text-sm text-gray-500">{t('manageEvents')}</p>
                        </div>
                    </div>
                    <motion.span 
                        className="px-3 py-1.5 rounded-full bg-red-50 text-sm font-semibold text-red-600 border border-red-100"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        {t('activeEventsCount', { count: dashboardEvents.length })}
                    </motion.span>
                </div>

                {dashboardEvents.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="p-16 text-center bg-gradient-to-br from-gray-50 to-white border-gray-200 border-dashed rounded-3xl">
                            <motion.div
                                initial={{ y: 10 }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                            >
                                <Calendar className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('noEvents')}</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                {t('exploreText')}
                            </p>
                            <Button asChild className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-200">
                                <Link href="/university/explore">
                                    {t('exploreBtn')} <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </Card>
                    </motion.div>
                ) : (
                    <StaggerContainer className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {dashboardEvents.map(({ event, status }) => {
                            const isAccepted = status === 'ACCEPTED' || status === 'INVITED';
                            const isPending = status === 'REQUESTED';
                            
                            return (
                                <StaggerItem key={event.id}>
                                    <motion.div
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                                    >
                                        <Card className="group bg-white border-gray-100 hover:border-red-200 hover:shadow-2xl hover:shadow-red-100/40 transition-all duration-500 text-gray-900 overflow-hidden rounded-2xl">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start mb-3">
                                                    {isAccepted ? (
                                                        <motion.div 
                                                            className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 shadow-sm"
                                                            initial={{ scale: 0.9 }}
                                                            animate={{ scale: 1 }}
                                                        >
                                                            <motion.div 
                                                                className="w-2 h-2 rounded-full bg-emerald-500"
                                                                animate={{ 
                                                                    boxShadow: ["0 0 0 0 rgba(16,185,129,0.4)", "0 0 0 8px rgba(16,185,129,0)", "0 0 0 0 rgba(16,185,129,0)"]
                                                                }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                            /> 
                                                            {t('status.active')}
                                                        </motion.div>
                                                    ) : isPending ? (
                                                        <div className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> {t('status.pending')}
                                                        </div>
                                                    ) : (
                                                        <div className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-100 shadow-sm">
                                                            {t('status.available')}
                                                        </div>
                                                    )}
                                                </div>
                                                <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-red-600 transition-colors duration-300 leading-tight">
                                                    {event.title}
                                                </CardTitle>
                                                <div className="space-y-3 pt-4">
                                                    <div className="flex items-center text-sm text-gray-500 gap-3">
                                                        <div className="p-2 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
                                                            <Calendar className="h-4 w-4 text-red-500" />
                                                        </div>
                                                        <span className="font-medium">{format(new Date(event.startDateTime), "MMM d, yyyy")}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500 gap-3">
                                                        <div className="p-2 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
                                                            <MapPin className="h-4 w-4 text-red-500" />
                                                        </div>
                                                        <span className="font-medium">{event.city}, {event.country}</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Button 
                                                        className={`w-full transition-all font-semibold h-12 rounded-xl group/btn ${
                                                            isAccepted 
                                                            ? "bg-gray-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white text-gray-700 border border-gray-200 hover:border-transparent hover:shadow-lg hover:shadow-red-200" 
                                                            : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300"
                                                        }`} 
                                                        asChild
                                                    >
                                                        <Link href={`/university/events/${event.id}`}>
                                                            {isAccepted ? t('openDashboard') : t('viewDetails')}
                                                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                                        </Link>
                                                    </Button>
                                                </motion.div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </StaggerItem>
                            );
                        })}
                    </StaggerContainer>
                )}
            </motion.div>
        </motion.div>
    );
}
