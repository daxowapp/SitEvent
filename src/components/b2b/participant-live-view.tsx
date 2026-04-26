"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Clock, CheckCircle2, Timer, MapPin, Users, Hourglass,
} from "lucide-react";

type ParticipantData = NonNullable<
  Awaited<ReturnType<typeof import("@/app/actions/b2b-public").getParticipantLiveView>>
>;

function MeetingTimer({ startTime, durationMinutes }: { startTime: Date | string; durationMinutes: number }) {
  const [remaining, setRemaining] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const totalMs = durationMinutes * 60 * 1000;
    const end = start + totalMs;
    const tick = () => {
      const now = Date.now();
      const diff = end - now;
      setProgress(Math.min(((now - start) / totalMs) * 100, 100));
      if (diff <= 0) {
        setRemaining("Ending...");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  return (
    <div className="space-y-2">
      <p className="text-3xl font-mono font-bold text-center text-emerald-400">{remaining}</p>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${progress > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ParticipantLiveView({ data, token }: { data: ParticipantData; token: string }) {
  const router = useRouter();

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const statusConfig = {
    NOT_ARRIVED: { label: "Not Checked In", color: "bg-gray-600", icon: Clock, text: "Please check in at the registration desk when you arrive." },
    WAITING: { label: "In Queue", color: "bg-amber-600", icon: Hourglass, text: "You're in the queue. You'll be assigned to a university shortly." },
    IN_MEETING: { label: "In Meeting", color: "bg-emerald-600", icon: Users, text: "You're currently in a meeting." },
    DONE: { label: "All Done", color: "bg-purple-600", icon: CheckCircle2, text: "You've completed all your meetings. Thank you!" },
  };

  const status = statusConfig[data.participant.liveStatus as keyof typeof statusConfig] || statusConfig.NOT_ARRIVED;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-gray-400">{data.event.name}</p>
          <h1 className="font-bold text-lg">{data.participant.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {data.participant.organization && <span>{data.participant.organization}</span>}
            {data.event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{data.event.location}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        {/* STATUS CARD */}
        <Card className="border-2 border-gray-700 bg-gray-900 overflow-hidden">
          <div className={`${status.color} px-4 py-2.5 flex items-center gap-2`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">{status.label}</span>
            {data.queuePosition && (
              <Badge variant="outline" className="ml-auto border-white/30 text-white text-xs">
                #{data.queuePosition} in line
              </Badge>
            )}
          </div>
          <CardContent className="p-6">
            {data.participant.liveStatus === "IN_MEETING" && data.activeMeeting ? (
              <div className="space-y-4 text-center">
                <div>
                  <p className="text-xs text-gray-400 mb-1">You're meeting with</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-white">
                        {data.activeMeeting.participantA.university?.name || data.activeMeeting.participantA.name}
                      </h2>
                      {data.activeMeeting.participantA.university?.country && (
                        <p className="text-sm text-gray-400">{data.activeMeeting.participantA.university.country}</p>
                      )}
                    </div>
                  </div>
                </div>

                {data.activeMeeting.actualStart && (
                  <MeetingTimer
                    startTime={data.activeMeeting.actualStart}
                    durationMinutes={data.event.slotDuration}
                  />
                )}
              </div>
            ) : data.participant.liveStatus === "WAITING" ? (
              <div className="text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-amber-900/30 flex items-center justify-center mx-auto">
                  <Hourglass className="h-8 w-8 text-amber-400 animate-pulse" />
                </div>
                <p className="text-gray-300">{status.text}</p>
                {data.queuePosition && (
                  <p className="text-4xl font-bold text-amber-400">#{data.queuePosition}</p>
                )}
              </div>
            ) : data.participant.liveStatus === "DONE" ? (
              <div className="text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-gray-300">{status.text}</p>
                <p className="text-2xl font-bold text-purple-400">{data.stats.completed} meetings completed</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-400">{status.text}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PROGRESS */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Meetings completed</span>
          <span className="font-bold text-white">{data.stats.completed} / {data.stats.totalUniversities}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${data.stats.totalUniversities > 0 ? (data.stats.completed / data.stats.totalUniversities) * 100 : 0}%` }}
          />
        </div>

        {/* COMPLETED MEETINGS */}
        {data.completedMeetings.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />Your Meetings
            </h3>
            <div className="space-y-2">
              {data.completedMeetings.map((m) => {
                const uniName = m.participantA.university?.name || m.participantA.name;
                const duration = m.actualStart && m.actualEnd
                  ? Math.round((new Date(m.actualEnd).getTime() - new Date(m.actualStart).getTime()) / 60000)
                  : null;
                return (
                  <div key={m.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
                    <div className="h-8 w-8 rounded-full bg-blue-900/50 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{uniName}</p>
                      <p className="text-xs text-gray-500">
                        {duration && `${duration} min · `}
                        {m.actualEnd && format(new Date(m.actualEnd), "HH:mm")}
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
