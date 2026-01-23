"use client";

import { formatDistanceToNow } from "date-fns";
import { UserPlus, AlertTriangle, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ActivityItem {
    id: string;
    type: string;
    user: {
        name: string;
        email: string;
    };
    event: {
        title: string;
    };
    createdAt: Date;
}

interface ActionOverview {
    registrationsLastHour: number;
    pendingApprovals: number;
}

interface ActivityTimelineProps {
    activities: ActivityItem[];
    overview: ActionOverview;
}

export function ActivityTimeline({ activities, overview }: ActivityTimelineProps) {
    return (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 h-full flex flex-col shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 font-['Outfit'] flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-violet-600" />
                Live Activity
                <span className="flex items-center gap-1.5 ml-auto text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live
                </span>
            </h3>

            <div className="flex-1 relative min-h-0">
                {/* Timeline Line - Gradient */}
                <div className="absolute left-[19px] top-2 bottom-6 w-[2px] bg-gradient-to-b from-violet-200 via-slate-200 to-transparent" />

                <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                    {activities.length === 0 ? (
                        <p className="text-slate-500 text-sm pl-12">No recent activity</p>
                    ) : (
                        activities.map((item, i) => (
                            <div key={item.id} className="relative flex gap-4 group">
                                {/* Timeline Node */}
                                <div className="relative z-10 flex-shrink-0">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-300 group-hover:scale-110",
                                        "bg-white border-slate-200 group-hover:border-violet-300"
                                    )}>
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.email}`} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px]">
                                                {item.user.name?.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>

                                <div className="flex-1 pt-1.5">
                                    <p className="text-sm text-slate-900 font-medium leading-none">
                                        <span className="font-semibold text-slate-700">{item.user.name}</span>
                                        <span className="font-normal text-slate-500"> registered for </span>
                                        <span className="text-violet-600 hover:underline cursor-pointer transition-colors">
                                            {item.event.title}
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1.5 font-['JetBrains_Mono']">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
