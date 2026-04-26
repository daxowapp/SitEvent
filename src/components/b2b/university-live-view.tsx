"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Clock, Timer, CheckCircle2, Users,
  Square, Loader2, Volume2, VolumeX,
} from "lucide-react";
import { endMeeting } from "@/app/actions/b2b-live";
import { toast } from "sonner";

type UniversityData = NonNullable<
  Awaited<ReturnType<typeof import("@/app/actions/b2b-public").getUniversityLiveView>>
>;

function playChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1318, now + 0.15);
    osc.frequency.setValueAtTime(1760, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  } catch {}
}

function MeetingCountdown({
  startTime,
  durationMinutes,
  onExpired,
  soundEnabled,
}: {
  startTime: Date | string;
  durationMinutes: number;
  onExpired: () => void;
  soundEnabled: boolean;
}) {
  const [remaining, setRemaining] = useState("");
  const [progress, setProgress] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [startTime]);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const totalMs = durationMinutes * 60 * 1000;
    const endTime = start + totalMs;

    const tick = () => {
      const now = Date.now();
      const diffMs = endTime - now;
      setProgress(Math.min(((now - start) / totalMs) * 100, 100));

      if (diffMs <= 0) {
        setRemaining("00:00");
        setIsOvertime(true);
        if (!firedRef.current) {
          firedRef.current = true;
          if (soundEnabled) playChime();
          onExpired();
        }
      } else {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setRemaining(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onExpired, soundEnabled]);

  return (
    <div className="space-y-2">
      <p className={`text-5xl font-mono font-bold text-center ${isOvertime ? "text-red-500 animate-pulse" : remaining <= "02:00" ? "text-amber-400" : "text-emerald-400"}`}>
        {isOvertime ? "ENDING..." : remaining}
      </p>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isOvertime ? "bg-red-500" : progress > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function UniversityLiveView({ data, token }: { data: UniversityData; token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const handleEndMeeting = async () => {
    if (!data.activeMeeting || loading) return;
    setLoading(true);
    const result = await endMeeting(data.activeMeeting.id);
    if (result.error) toast.error(result.error);
    else toast.success(result.message);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* HEADER */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{data.universityName}</h1>
              <p className="text-xs text-gray-400">{data.event.name} · {data.event.slotDuration}min meetings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={soundEnabled ? "text-emerald-400" : "text-gray-500"}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Badge variant="outline" className="border-emerald-500 text-emerald-400">
              {data.stats.completed} / {data.stats.totalParticipants} meetings
            </Badge>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {data.activeMeeting ? (
            <Card className="border-2 border-emerald-500/50 bg-emerald-950/20">
              <CardContent className="p-8 space-y-6 text-center">
                <Badge className="bg-emerald-600 text-white text-xs">NOW MEETING</Badge>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    {data.activeMeeting.participantB.name}
                  </h2>
                  <p className="text-gray-400">
                    {[data.activeMeeting.participantB.organization, data.activeMeeting.participantB.country]
                      .filter(Boolean).join(" · ")}
                  </p>
                  {data.activeMeeting.participantB.contactPerson && (
                    <p className="text-sm text-gray-500 mt-1">
                      Contact: {data.activeMeeting.participantB.contactPerson}
                    </p>
                  )}
                </div>

                {data.activeMeeting.actualStart && (
                  <MeetingCountdown
                    startTime={data.activeMeeting.actualStart}
                    durationMinutes={data.event.slotDuration}
                    onExpired={handleEndMeeting}
                    soundEnabled={soundEnabled}
                  />
                )}

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 gap-2"
                  onClick={handleEndMeeting}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                  End Meeting Early
                </Button>

                {data.waitingCount > 0 && (
                  <p className="text-sm text-amber-400">
                    <Clock className="h-3.5 w-3.5 inline mr-1" />
                    {data.waitingCount} participant{data.waitingCount > 1 ? "s" : ""} waiting
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-gray-700 bg-gray-900">
              <CardContent className="p-12 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-gray-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-300">
                  {data.waitingCount > 0
                    ? "Next participant coming soon..."
                    : "Waiting for participants"}
                </h2>
                <p className="text-sm text-gray-500">
                  {data.waitingCount > 0
                    ? `${data.waitingCount} in queue`
                    : "Participants will be assigned as they check in"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* COMPLETED MEETINGS */}
      {data.completedMeetings.length > 0 && (
        <div className="border-t border-gray-800 bg-gray-900 px-6 py-4">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />Completed ({data.completedMeetings.length})
            </h3>
            <div className="space-y-1.5">
              {data.completedMeetings.map((m) => {
                const duration = m.actualStart && m.actualEnd
                  ? Math.round((new Date(m.actualEnd).getTime() - new Date(m.actualStart).getTime()) / 60000)
                  : null;
                return (
                  <div key={m.id} className="flex items-center justify-between text-sm py-1.5">
                    <span className="text-gray-300">{m.participantB.name}</span>
                    <span className="text-xs text-gray-500">
                      {duration && `${duration}min · `}
                      {m.actualEnd && format(new Date(m.actualEnd), "HH:mm")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
