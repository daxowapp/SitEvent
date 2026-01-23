"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Users, Calendar, TrendingUp, Zap, BarChart3, Activity, Globe, Settings } from "lucide-react";

const ICONS = {
    Users,
    Calendar,
    TrendingUp,
    Zap,
    BarChart3,
    Activity,
    Globe,
    Settings,
} as const;

type IconName = keyof typeof ICONS;

interface StatCardProps {
    title: string;
    value: number;
    subtitle?: string;
    iconName: IconName;
    trend?: { value: number; label: string };
    variant?: "default" | "primary" | "accent";
    size?: "default" | "large";
    className?: string;
}

function useCountUp(end: number, duration: number = 1500) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        countRef.current = 0;
        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

            // Easing function (ease-out-expo)
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.floor(eased * end);

            if (current !== countRef.current) {
                countRef.current = current;
                setCount(current);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [end, duration]);

    return count;
}

export function StatCard({
    title,
    value,
    subtitle,
    iconName,
    trend,
    variant = "default",
    size = "default",
    className
}: StatCardProps) {
    const Icon = ICONS[iconName];
    const animatedValue = useCountUp(value);

    const variants = {
        default: "bg-white border-slate-200 shadow-sm",
        primary: "bg-white border-violet-100 shadow-sm shadow-violet-100",
        accent: "bg-white border-cyan-100 shadow-sm shadow-cyan-100",
    };

    const iconColors = {
        default: "text-slate-600 bg-slate-100",
        primary: "text-violet-600 bg-violet-50",
        accent: "text-cyan-600 bg-cyan-50",
    };

    return (
        <div
            className={cn(
                "group relative rounded-2xl border transition-all duration-300 h-full flex flex-col justify-between",
                "hover:-translate-y-1 hover:shadow-md",
                variants[variant],
                size === "large" ? "p-8" : "p-6",
                className
            )}
        >
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        "p-3 rounded-xl",
                        iconColors[variant]
                    )}>
                        <Icon className={size === "large" ? "w-6 h-6" : "w-5 h-5"} />
                    </div>

                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                            trend.value >= 0
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-red-700 bg-red-50"
                        )}>
                            <span>{trend.value >= 0 ? "↑" : "↓"}</span>
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                <p className="text-slate-500 text-sm font-medium mb-1 font-['Outfit']">
                    {title}
                </p>

                <p className={cn(
                    "font-bold tracking-tight font-['JetBrains_Mono'] text-slate-900",
                    size === "large" ? "text-5xl" : "text-3xl"
                )}>
                    {animatedValue.toLocaleString()}
                </p>

                {subtitle && (
                    <p className="text-slate-400 text-xs mt-2 font-['Outfit']">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
