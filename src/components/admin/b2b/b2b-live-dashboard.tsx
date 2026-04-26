"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Clock, Users, GraduationCap, UserCheck, UserX,
  Loader2, RotateCcw, Radio, Square, Timer, CheckCircle2,
  AlertTriangle, Undo2, Volume2, VolumeX, Link2, Copy, UserMinus, UsersRound, UserPlus,
} from "lucide-react";
import {
  checkInParticipant, endMeeting, undoCheckIn, resetLiveSession,
  markParticipantDone, bulkCheckIn, walkInCheckIn,
} from "@/app/actions/b2b-live";

type LiveData = NonNullable<
  Awaited<ReturnType<typeof import("@/app/actions/b2b-live").getLiveDashboard>>
>;

// ============================================
// NOTIFICATION SOUND
// ============================================

function playNotificationSound() {
  try {
    // Generate a pleasant chime using Web Audio API
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second tone (higher, delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.5, now + 0.15); // E6
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);

    // Third tone (resolution)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1760, now + 0.3); // A6
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.25, now + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.3);
    osc3.stop(now + 1.0);
  } catch {
    // AudioContext not available (e.g., server-side)
  }
}

// ============================================
// COUNTDOWN TIMER — auto-ends meeting
// ============================================

function MeetingCountdown({
  startTime,
  durationMinutes,
  meetingId,
  onAutoEnd,
  soundEnabled,
}: {
  startTime: Date | string;
  durationMinutes: number;
  meetingId: string;
  onAutoEnd: (id: string) => void;
  soundEnabled: boolean;
}) {
  const [remaining, setRemaining] = useState("");
  const [isOvertime, setIsOvertime] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoEndedRef = useRef(false);

  useEffect(() => {
    autoEndedRef.current = false;
  }, [meetingId]);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const totalMs = durationMinutes * 60 * 1000;
    const endTime = start + totalMs;

    const tick = () => {
      const now = Date.now();
      const diffMs = endTime - now;
      const elapsedMs = now - start;
      setProgress(Math.min((elapsedMs / totalMs) * 100, 100));

      if (diffMs <= 0) {
        setRemaining("00:00");
        setIsOvertime(true);

        // Auto-end the meeting
        if (!autoEndedRef.current) {
          autoEndedRef.current = true;
          if (soundEnabled) playNotificationSound();
          onAutoEnd(meetingId);
        }
      } else {
        setIsOvertime(false);
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setRemaining(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes, meetingId, onAutoEnd, soundEnabled]);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <span className={`font-mono text-lg font-bold ${isOvertime ? "text-red-500 animate-pulse" : remaining <= "02:00" ? "text-amber-400" : "text-emerald-400"}`}>
          {isOvertime ? "ENDING..." : remaining}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isOvertime ? "bg-red-500" : progress > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function WaitTimer({ arrivedAt }: { arrivedAt: Date | string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(arrivedAt).getTime();
    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(diff / 60);
      setElapsed(`${mins}m`);
    };
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, [arrivedAt]);

  return <span className="text-xs text-muted-foreground">waiting {elapsed}</span>;
}

// ============================================
// MAIN DASHBOARD
// ============================================

export function B2BLiveDashboard({ data }: { data: LiveData }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const handleCheckIn = useCallback(async (id: string) => {
    setLoading(`checkin-${id}`);
    const result = await checkInParticipant(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message);
      if (soundEnabled) playNotificationSound();
    }
    setLoading("");
    router.refresh();
  }, [router, soundEnabled]);

  const handleEndMeeting = useCallback(async (id: string) => {
    if (loading.startsWith("end-")) return; // Prevent double-trigger
    setLoading(`end-${id}`);
    const result = await endMeeting(id);
    if (result.error) toast.error(result.error);
    else toast.success(result.message);
    setLoading("");
    router.refresh();
  }, [router, loading]);

  const handleUndo = useCallback(async (id: string) => {
    setLoading(`undo-${id}`);
    const result = await undoCheckIn(id);
    if (result.error) toast.error(result.error);
    else toast.success("Check-in undone");
    setLoading("");
    router.refresh();
  }, [router]);

  const handleReset = useCallback(async () => {
    setLoading("reset");
    const result = await resetLiveSession(data.event.id);
    if (result.error) toast.error(result.error);
    else toast.success("Live session reset!");
    setLoading("");
    router.refresh();
  }, [data.event.id, router]);

  const handleMarkDone = useCallback(async (id: string) => {
    setLoading(`done-${id}`);
    const result = await markParticipantDone(id);
    if (result.error) toast.error(result.error);
    else toast.success("Marked as done");
    setLoading("");
    router.refresh();
  }, [router]);

  const handleBulkCheckIn = useCallback(async () => {
    setLoading("bulk");
    const result = await bulkCheckIn(data.event.id);
    if (result.error) toast.error(result.error);
    else toast.success(result.message);
    setLoading("");
    router.refresh();
  }, [data.event.id, router]);

  const handleWalkIn = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("walkin");
    const formData = new FormData(e.currentTarget);
    const result = await walkInCheckIn(data.event.id, formData);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message);
      (e.target as HTMLFormElement).reset();
    }
    setLoading("");
    router.refresh();
  }, [data.event.id, router]);

  const { stats } = data;

  const copyLink = useCallback((path: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/b2b/${data.event.id}`}>
            <Button variant="outline" size="icon" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                <Radio className="h-3 w-3" />LIVE
              </div>
              <h1 className="text-xl font-bold">{data.event.name}</h1>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {data.event.location && `${data.event.location} · `}
              {data.event.startTime} — {data.event.endTime} · {data.event.slotDuration}min slots
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className={`border-gray-700 gap-1.5 ${soundEnabled ? "text-emerald-400" : "text-gray-500"}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {soundEnabled ? "Sound On" : "Sound Off"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Reset live session?</AlertDialogTitle>
                <AlertDialogDescription>This will delete all meetings and reset all check-ins. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-gray-700 text-gray-300">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                  {loading === "reset" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Universities", value: stats.totalUniversities, icon: GraduationCap, color: "text-blue-400" },
          { label: "Active Now", value: stats.activeNow, icon: Radio, color: "text-emerald-400" },
          { label: "Idle", value: stats.idleNow, icon: AlertTriangle, color: stats.idleNow > 0 && stats.waiting > 0 ? "text-red-400" : "text-gray-400" },
          { label: "Waiting", value: stats.waiting, icon: Clock, color: "text-amber-400" },
          { label: "Completed", value: stats.totalCompleted, icon: CheckCircle2, color: "text-purple-400" },
          { label: "Progress", value: `${stats.completionPercent}%`, icon: Timer, color: "text-cyan-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />{s.label}
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: UNIVERSITY CARDS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />Universities ({stats.totalUniversities})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.universityCards.map((card, idx) => (
              <Card
                key={card.participant.id}
                className={`border-2 transition-all ${
                  card.status === "IN_MEETING"
                    ? "border-emerald-500/50 bg-emerald-950/30"
                    : data.waitingQueue.length > 0
                    ? "border-red-500/50 bg-red-950/20 animate-pulse"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Uni header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {card.participant.university?.name || card.participant.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-gray-400">
                          Table {idx + 1} · {card.completedCount} meetings
                        </p>
                        <button
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                          onClick={() => copyLink(`/b2b/university/${card.participant.scheduleToken}`)}
                          title="Copy university link"
                        >
                          <Link2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        card.status === "IN_MEETING"
                          ? "border-emerald-500 text-emerald-400 text-xs"
                          : "border-gray-600 text-gray-400 text-xs"
                      }
                    >
                      {card.status === "IN_MEETING" ? "Active" : "Idle"}
                    </Badge>
                  </div>

                  {/* Meeting info or idle state */}
                  {card.activeMeeting ? (
                    <div className="space-y-2">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Meeting with</p>
                        <p className="font-medium text-white">
                          {card.activeMeeting.participantB.name}
                        </p>
                        {card.activeMeeting.participantB.organization && (
                          <p className="text-xs text-gray-400">
                            {card.activeMeeting.participantB.organization}
                            {card.activeMeeting.participantB.country && ` · ${card.activeMeeting.participantB.country}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {card.activeMeeting.actualStart && (
                          <MeetingCountdown
                            startTime={card.activeMeeting.actualStart}
                            durationMinutes={data.event.slotDuration}
                            meetingId={card.activeMeeting.id}
                            onAutoEnd={handleEndMeeting}
                            soundEnabled={soundEnabled}
                          />
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 gap-1.5 text-xs"
                        onClick={() => handleEndMeeting(card.activeMeeting!.id)}
                        disabled={loading === `end-${card.activeMeeting!.id}`}
                      >
                        {loading === `end-${card.activeMeeting!.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Square className="h-3 w-3" />
                        )}
                        End Meeting Early
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        {data.waitingQueue.length > 0
                          ? "⚡ Assigning next..."
                          : "Waiting for participants"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* RIGHT: QUEUE + CHECK-IN */}
        <div className="space-y-6">
          {/* WAITING QUEUE */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-400" />Waiting Queue ({data.waitingQueue.length})
            </h2>
            {data.waitingQueue.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-500">No one waiting</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.waitingQueue.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-400 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <div className="flex items-center gap-2">
                          {p.organization && <span className="text-xs text-gray-400">{p.organization}</span>}
                          {p.arrivedAt && <WaitTimer arrivedAt={p.arrivedAt} />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-amber-400"
                        onClick={() => handleMarkDone(p.id)}
                        disabled={loading === `done-${p.id}`}
                        title="Mark as done (left early)"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-400"
                        onClick={() => handleUndo(p.id)}
                        disabled={loading === `undo-${p.id}`}
                        title="Undo check-in"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHECK-IN PANEL */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-400" />Check In ({data.notArrived.length} remaining)
              </h2>
              {data.notArrived.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20 gap-1.5 text-xs h-7"
                  onClick={handleBulkCheckIn}
                  disabled={loading === "bulk"}
                >
                  {loading === "bulk" ? <Loader2 className="h-3 w-3 animate-spin" /> : <UsersRound className="h-3 w-3" />}
                  Check In All
                </Button>
              )}
            </div>
            {data.notArrived.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-500">Everyone has arrived! 🎉</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {data.notArrived.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      {p.organization && <p className="text-xs text-gray-400">{p.organization} {p.country && `· ${p.country}`}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="text-gray-500 hover:text-blue-400 transition-colors p-1"
                        onClick={() => copyLink(`/b2b/participant/${p.scheduleToken}`)}
                        title="Copy participant link"
                      >
                        <Link2 className="h-3 w-3" />
                      </button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs h-8"
                        onClick={() => handleCheckIn(p.id)}
                        disabled={loading === `checkin-${p.id}`}
                      >
                        {loading === `checkin-${p.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        Check In
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WALK-IN (not on the list) */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <UserPlus className="h-4 w-4 text-emerald-400" />Walk-in
            </h2>
            <form onSubmit={handleWalkIn} className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
              <input
                name="name"
                placeholder="Name *"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                name="organization"
                placeholder="Organization (optional)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                name="contactPhone"
                placeholder="Phone (optional)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                type="submit"
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs"
                disabled={loading === "walkin"}
              >
                {loading === "walkin" ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                Add & Check In
              </Button>
            </form>
          </div>

          {/* DONE PARTICIPANTS */}
          {data.done.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />Completed ({data.done.length})
              </h2>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {data.done.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 bg-gray-900/50 border border-gray-800/50 rounded-lg px-3 py-2 opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <p className="text-sm text-gray-300">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMPLETED MEETINGS LOG */}
      {data.completedMeetings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />Meeting Log ({data.completedMeetings.length})
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs">
                  <th className="text-left p-3">University</th>
                  <th className="text-left p-3">Participant</th>
                  <th className="text-left p-3">Duration</th>
                  <th className="text-left p-3">Ended</th>
                </tr>
              </thead>
              <tbody>
                {data.completedMeetings.slice(0, 30).map((m) => {
                  const duration = m.actualStart && m.actualEnd
                    ? Math.round((new Date(m.actualEnd).getTime() - new Date(m.actualStart).getTime()) / 60000)
                    : "—";
                  return (
                    <tr key={m.id} className="border-b border-gray-800/50 text-gray-300">
                      <td className="p-3">{m.participantA.university?.name || m.participantA.name}</td>
                      <td className="p-3">{m.participantB.name}</td>
                      <td className="p-3 font-mono">{duration} min</td>
                      <td className="p-3 text-xs text-gray-500">
                        {m.actualEnd ? format(new Date(m.actualEnd), "HH:mm") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
