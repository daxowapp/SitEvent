"use client";

import { useEffect, useState } from "react";
import { differenceInSeconds } from "date-fns";

interface CountdownTimerProps {
    targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const interval = setInterval(() => {
            const now = new Date();
            const diff = differenceInSeconds(targetDate, now);

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(diff / (3600 * 24));
            const hours = Math.floor((diff % (3600 * 24)) / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            setTimeLeft({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    // Prevent hydration mismatch by rendering simpler placeholder or null initially
    if (!isClient) return null;

    // Helper to pad numbers with zero
    const f = (n: number) => n.toString().padStart(2, '0');

    return (
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <TimeUnit value={f(timeLeft.days)} label="Days" />
            <div className="text-4xl md:text-5xl font-light text-white/30 self-start mt-2">:</div>
            <TimeUnit value={f(timeLeft.hours)} label="Hours" />
            <div className="text-4xl md:text-5xl font-light text-white/30 self-start mt-2">:</div>
            <TimeUnit value={f(timeLeft.minutes)} label="Mins" />
            <div className="text-4xl md:text-5xl font-light text-white/30 self-start mt-2">:</div>
            <TimeUnit value={f(timeLeft.seconds)} label="Secs" />
        </div>
    );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500" />

                {/* Glass Card */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center shadow-xl">
                    <span className="font-display text-4xl md:text-5xl font-bold text-white tabular-nums tracking-tight drop-shadow-lg">
                        {value}
                    </span>
                </div>
            </div>
            <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/70 font-medium">
                {label}
            </span>
        </div>
    );
}
