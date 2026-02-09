"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";
import { MapPin, User, CheckCircle2, Radio, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Session {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    location: string | null;
    speaker: string | null;
}

interface EventProgramTimelineProps {
    sessions: Session[];
    timezone: string;
}

type SessionStatus = "upcoming" | "live" | "finished";

export function EventProgramTimeline({ sessions, timezone }: EventProgramTimelineProps) {
    // Current time in UTC (for comparison with session times which are also UTC objects)
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Update 'now' every minute to refresh status
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const getStatus = (start: Date, end: Date): SessionStatus => {
        if (now < start) return "upcoming";
        if (now >= start && now <= end) return "live";
        return "finished";
    };

    // Sort sessions just in case
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (sessions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                <p>No program schedule available yet.</p>
            </div>
        );
    }

    // Group sessions by date
    const groupedSessions = sortedSessions.reduce((groups, session) => {
        const dateKey = formatInTimeZone(session.startTime, timezone, "yyyy-MM-dd");
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(session);
        return groups;
    }, {} as Record<string, Session[]>);

    return (
        <div className="space-y-8">
            {Object.entries(groupedSessions).map(([date, groupSessions]) => (
                <div key={date}>
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 mb-2 border-b border-border/50">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {formatInTimeZone(groupSessions[0].startTime, timezone, "EEEE, MMMM d, yyyy")}
                        </h3>
                    </div>

                    <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 py-4">
                        {groupSessions.map((session) => {
                            // ...
                            const status = getStatus(new Date(session.startTime), new Date(session.endTime));
                            const isLive = status === "live";
                            const isFinished = status === "finished";

                            return (
                                <div key={session.id} className={cn("relative pl-8 transition-all duration-500", isLive ? "scale-[1.02]" : "opacity-90")}>
                                    {/* Timeline Dot */}
                                    <div
                                        className={cn(
                                            "absolute -left-[9px] top-6 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 transition-colors duration-500",
                                            isLive ? "bg-red-500 animate-pulse ring-4 ring-red-100" : 
                                            isFinished ? "bg-gray-400" : "bg-blue-500"
                                        )}
                                    />

                                    {/* Card */}
                                    <Card 
                                        className={cn(
                                            "overflow-hidden transition-all duration-300",
                                            isLive ? "border-red-200 shadow-md ring-1 ring-red-100" : 
                                            isFinished ? "bg-gray-50 border-gray-100" : "hover:border-blue-200"
                                        )}
                                    >
                                        {isLive && (
                                            <div className="bg-red-50 px-4 py-1 flex items-center gap-2 text-xs font-bold text-red-600 border-b border-red-100">
                                                <Radio className="w-3 h-3 animate-pulse" /> HAPPENING NOW
                                            </div>
                                        )}
                                        
                                        <CardContent className="p-4 sm:p-5">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <h3 className={cn("font-bold text-lg mb-1", isFinished && "text-gray-500 line-through decoration-gray-300")}>
                                                        {session.title}
                                                    </h3>
                                                    {session.description && (
                                                        <p className="text-sm text-muted-foreground max-w-xl mb-3">
                                                            {session.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className={cn("font-mono font-medium text-lg", isLive ? "text-red-600" : "text-gray-700")}>
                                                        {formatInTimeZone(session.startTime, timezone, "HH:mm")}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatInTimeZone(session.endTime, timezone, "HH:mm")}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                                                {session.location && (
                                                    <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span>{session.location}</span>
                                                    </div>
                                                )}
                                                {session.speaker && (
                                                    <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span>{session.speaker}</span>
                                                    </div>
                                                )}
                                                {isFinished && (
                                                    <div className="flex items-center gap-1.5 text-green-600 font-medium px-2 py-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Completed</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
