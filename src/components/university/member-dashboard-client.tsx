"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Camera, Users, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface MemberDashboardClientProps {
    universityName: string;
    totalScanned: number;
}

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

export function MemberDashboardClient({ 
    universityName, 
    totalScanned 
}: MemberDashboardClientProps) {
    const t = useTranslations('university.dashboard');

    return (
        <motion.div 
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Hero Header */}
            <motion.div 
                className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-500/10 via-orange-500/5 to-purple-500/10"
                variants={heroVariants}
            >
                <div className="relative px-8 py-10 md:py-14">
                    <div className="flex flex-col md:flex-row shadow-none justify-between items-start md:items-center gap-6">
                        <div className="space-y-4">
                            <motion.div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-red-100 shadow-sm"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Sparkles className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-semibold text-red-700">Scanner Representative</span>
                            </motion.div>
                            
                            <h1 className="text-3xl md:text-5xl font-display font-bold text-gray-900 tracking-tight leading-tight">
                                {t('welcome')}
                                <br />
                                <span className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
                                    {universityName}
                                </span>
                            </h1>
                            
                            <p className="text-lg text-gray-600 max-w-xl">
                                Access your scanner tool instantly and review all the leads you have collected.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Stats Grid */}
            <motion.div 
                className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
                variants={containerVariants}
            >
                {/* Total Leads Scanned */}
                <motion.div variants={itemVariants}>
                    <Card className="h-full bg-gradient-to-br from-red-500 via-red-600 to-orange-500 border-0 shadow-xl shadow-red-200 text-white relative overflow-hidden rounded-2xl min-h-[160px]">
                        <motion.div 
                            className="absolute -right-4 -bottom-4 opacity-20"
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Users className="w-28 h-28" />
                        </motion.div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-300" />
                                Scanned Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-5xl font-display font-bold">
                                {totalScanned}
                            </div>
                            <p className="text-sm text-white/80 mt-2">Total successful QR code scans</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <Button 
                        asChild 
                        className="w-full h-24 bg-white hover:bg-red-50 text-gray-900 border border-red-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all flex items-center justify-start px-6 gap-4"
                        variant="outline"
                    >
                        <Link href="/university/scanner">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                <Camera className="w-6 h-6" />
                            </div>
                            <div className="text-left flex-1">
                                <span className="block text-lg font-bold">Open Scanner</span>
                                <span className="block text-sm text-gray-500 font-normal">Scan student QR codes</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                        </Link>
                    </Button>
                    
                    <Button 
                        asChild 
                        className="w-full h-24 bg-white hover:bg-slate-50 text-gray-900 border border-slate-200 shadow-sm transition-all flex items-center justify-start px-6 gap-4"
                        variant="outline"
                    >
                        <Link href="/university/leads">
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="text-left flex-1">
                                <span className="block text-lg font-bold">View Leads</span>
                                <span className="block text-sm text-gray-500 font-normal">Browse your collected data</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                        </Link>
                    </Button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
