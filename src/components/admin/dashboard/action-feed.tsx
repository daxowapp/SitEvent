"use client";

import { Activity, AlertTriangle, CheckCircle2, Flame, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActionOverview {
    registrationsLastHour: number;
    pendingApprovals: number;
}

interface ActivityItem {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
}

interface ActionFeedProps {
    overview: ActionOverview;
    recentActivity: ActivityItem[]; // Assuming this structure from actions.ts modification
}

export function ActionFeed({ overview, recentActivity }: ActionFeedProps) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md h-full flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Live Action Feed
            </h3>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {/* 1. Critical Alerts Section */}
                {overview.pendingApprovals > 0 && (
                    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-md flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div>
                            <p className="font-semibold text-amber-200">Needs Approval</p>
                            <p className="text-sm text-amber-100/80">
                                {overview.pendingApprovals} university requests pending review.
                            </p>
                        </div>
                    </div>
                )}

                {overview.registrationsLastHour > 50 && (
                    <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r-md flex items-start gap-3">
                        <Flame className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-200">High Traffic</p>
                            <p className="text-sm text-red-100/80">
                                {overview.registrationsLastHour} registrations in the last hour!
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. Activity Stream */}
                <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent Activity</p>
                    {recentActivity.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No recent activity.</p>
                    ) : (
                        recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                                <div className="mt-1">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <UserPlus className="w-4 h-4 text-blue-400" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-200">{activity.message}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
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
