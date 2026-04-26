"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  GraduationCap, Clock, CheckCircle2, Users,
  Square, Loader2, Volume2, VolumeX, FileText, Send,
  Mail, Save, ChevronDown, ChevronUp, Radio, Coffee,
  UserCheck, Sparkles,
} from "lucide-react";
import { saveMeetingNotes, emailNotesToUniversity, sendFilesToParticipant, endMeetingByToken } from "@/app/actions/b2b-public";
import { toast } from "sonner";

type UniversityData = NonNullable<
  Awaited<ReturnType<typeof import("@/app/actions/b2b-public").getUniversityLiveView>>
>;

function playChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    // Three-tone ascending chime
    [880, 1318, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.3, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });
  } catch {}
}

// ============================================
// CIRCULAR COUNTDOWN TIMER
// ============================================
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

  useEffect(() => { firedRef.current = false; }, [startTime]);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const totalMs = durationMinutes * 60 * 1000;
    const endTime = start + totalMs;

    const tick = () => {
      const now = Date.now();
      const diffMs = endTime - now;
      const pct = Math.min(((now - start) / totalMs) * 100, 100);
      setProgress(pct);

      if (diffMs <= 0) {
        setRemaining("00:00");
        setIsOvertime(true);
        if (!firedRef.current) {
          firedRef.current = true;
          if (soundEnabled) playChime();
          onExpired();
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
  }, [startTime, durationMinutes, onExpired, soundEnabled]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const strokeColor = isOvertime ? "#ef4444" : progress > 80 ? "#f59e0b" : "#10b981";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-48 h-48">
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke={strokeColor}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-4xl font-bold ${isOvertime ? "text-red-500 animate-pulse" : progress > 80 ? "text-amber-400" : "text-emerald-400"}`}>
            {isOvertime ? "END" : remaining}
          </span>
        </div>
      </div>
      {/* Linear progress bar as well */}
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progress}%`, backgroundColor: strokeColor }}
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function UniversityLiveView({ data, token }: { data: UniversityData; token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notes, setNotes] = useState(data.activeMeeting?.notesA || "");
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setNotes(data.activeMeeting?.notesA || "");
  }, [data.activeMeeting?.id]);

  // Auto-refresh every 3 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [router]);

  const autoSaveNotes = useCallback((meetingId: string, value: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveMeetingNotes(token, meetingId, value);
    }, 1500);
  }, [token]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (data.activeMeeting) autoSaveNotes(data.activeMeeting.id, value);
  };

  const handleSaveNotes = async (meetingId: string, noteText: string) => {
    setLoading(`save-${meetingId}`);
    const result = await saveMeetingNotes(token, meetingId, noteText);
    if (result.error) toast.error(result.error);
    else toast.success("Notes saved!");
    setLoading("");
  };

  const handleEndMeeting = async () => {
    if (!data.activeMeeting || loading.startsWith("end")) return;
    if (notes.trim()) await saveMeetingNotes(token, data.activeMeeting.id, notes);
    setLoading("end");
    const result = await endMeetingByToken(token, data.activeMeeting.id);
    if (result.error) toast.error(result.error);
    else toast.success(result.message);
    setLoading("");
    setNotes("");
    router.refresh();
  };

  const handleEmailNotes = async () => {
    setLoading("email");
    const result = await emailNotesToUniversity(token);
    if (result.error) toast.error(result.error);
    else toast.success(result.message);
    setLoading("");
  };

  const handleSendFiles = async (meetingId: string) => {
    setLoading(`files-${meetingId}`);
    const result = await sendFilesToParticipant(token, meetingId);
    if (result.error) toast.error(result.error);
    else toast.success(result.message);
    setLoading("");
    router.refresh();
  };

  const completionPct = data.stats.totalParticipants > 0
    ? Math.round((data.stats.completed / data.stats.totalParticipants) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-[150px]" />
      </div>

      {/* ─── HEADER ─── */}
      <header className="relative z-10 backdrop-blur-xl bg-white/[0.03] border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-[#0a0a1a] animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-base text-white">{data.universityName}</h1>
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Radio className="h-3 w-3 text-red-400 animate-pulse" />
                  {data.event.name} · {data.event.slotDuration}min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-all ${soundEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-500"}`}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── STATS ROW ─── */}
      <div className="relative z-10 max-w-2xl mx-auto w-full px-5 pt-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{data.stats.completed}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Completed</p>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{data.waitingCount}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">In Queue</p>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{completionPct}%</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Progress</p>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 relative z-10 px-5 py-6">
        <div className="w-full max-w-2xl mx-auto space-y-5">

          {/* ───────── ACTIVE MEETING ───────── */}
          {data.activeMeeting ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/5 border border-emerald-500/20 backdrop-blur-sm">
              {/* Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

              <div className="p-6 space-y-5">
                {/* Status badge */}
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    NOW MEETING
                  </span>
                </div>

                {/* Participant info */}
                <div className="text-center space-y-2">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-2xl font-bold text-white">
                    {(data.activeMeeting.participantB.name || "?")[0].toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {data.activeMeeting.participantB.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {[data.activeMeeting.participantB.organization, data.activeMeeting.participantB.country]
                      .filter(Boolean).join(" · ")}
                  </p>
                  {data.activeMeeting.participantB.contactPerson && (
                    <p className="text-xs text-gray-500">
                      Contact: {data.activeMeeting.participantB.contactPerson}
                    </p>
                  )}
                </div>

                {/* Countdown */}
                {data.activeMeeting.actualStart && (
                  <MeetingCountdown
                    startTime={data.activeMeeting.actualStart}
                    durationMinutes={data.event.slotDuration}
                    onExpired={handleEndMeeting}
                    soundEnabled={soundEnabled}
                  />
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />Meeting Notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Type your meeting notes here... (auto-saves)"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder-gray-600 min-h-[80px] resize-none rounded-xl text-sm focus:border-emerald-500/40 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-gray-600">Auto-saves as you type</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {data.universityFiles.length > 0 && (
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all disabled:opacity-50"
                      onClick={() => handleSendFiles(data.activeMeeting!.id)}
                      disabled={loading === `files-${data.activeMeeting!.id}`}
                    >
                      {loading === `files-${data.activeMeeting!.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Send Files ({data.universityFiles.length})
                    </button>
                  )}
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                    onClick={handleEndMeeting}
                    disabled={loading === "end"}
                  >
                    {loading === "end" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                    End Meeting
                  </button>
                </div>

                {/* Queue info */}
                {data.waitingCount > 0 && (
                  <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <Users className="h-3.5 w-3.5 text-amber-400" />
                    <p className="text-xs text-amber-400 font-medium">
                      {data.waitingCount} participant{data.waitingCount > 1 ? "s" : ""} in queue
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ───────── IDLE / WAITING STATE ───────── */
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
              <div className="p-12 text-center space-y-5">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse" />
                  <div className="relative h-full w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                    {data.waitingCount > 0 ? (
                      <Coffee className="h-8 w-8 text-blue-400" />
                    ) : (
                      <Clock className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-200">
                    {data.waitingCount > 0
                      ? "Next participant incoming..."
                      : "Waiting for participants"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.waitingCount > 0
                      ? `${data.waitingCount} in queue — preparing next match`
                      : "Participants will appear here as they check in"}
                  </p>
                </div>
                {data.waitingCount > 0 && (
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────── EMAIL ALL NOTES ───────── */}
          {data.completedMeetings.length > 0 && (
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/8 border border-purple-500/15 text-purple-400 text-sm font-medium hover:bg-purple-500/15 transition-all disabled:opacity-50"
              onClick={handleEmailNotes}
              disabled={loading === "email"}
            >
              {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Email All Meeting Notes to Me
            </button>
          )}

          {/* ───────── COMPLETED MEETINGS ───────── */}
          {data.completedMeetings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Completed Meetings ({data.completedMeetings.length})
              </h3>
              <div className="space-y-1.5">
                {data.completedMeetings.map((m, idx) => {
                  const duration = m.actualStart && m.actualEnd
                    ? Math.round((new Date(m.actualEnd).getTime() - new Date(m.actualStart).getTime()) / 60000)
                    : null;
                  const isExpanded = expandedMeeting === m.id;
                  const editNote = editingNotes[m.id] ?? m.notesA;

                  return (
                    <div key={m.id} className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden transition-all hover:border-white/[0.1]">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                        onClick={() => setExpandedMeeting(isExpanded ? null : m.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {idx + 1}
                          </div>
                          <div className="text-left">
                            <span className="text-sm text-gray-200 font-medium">{m.participantB.name}</span>
                            {m.notesA && <FileText className="h-3 w-3 text-blue-400 inline ml-2" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {duration && (
                            <span className="text-[10px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
                              {duration}min
                            </span>
                          )}
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-white/[0.05] px-4 py-4 space-y-3">
                          {m.participantB.organization && (
                            <p className="text-xs text-gray-400">
                              {m.participantB.organization}{m.participantB.country && ` · ${m.participantB.country}`}
                            </p>
                          )}
                          <Textarea
                            value={editNote}
                            onChange={(e) => setEditingNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder="Add notes for this meeting..."
                            className="bg-white/[0.04] border-white/[0.08] text-white placeholder-gray-600 min-h-[60px] text-sm resize-none rounded-xl"
                          />
                          <div className="flex gap-2">
                            <button
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/8 border border-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/15 transition-all disabled:opacity-50"
                              onClick={() => handleSaveNotes(m.id, editNote)}
                              disabled={loading === `save-${m.id}`}
                            >
                              {loading === `save-${m.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              Save Notes
                            </button>
                            {data.universityFiles.length > 0 && (
                              <button
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                                  m.documentsSent
                                    ? "bg-emerald-500/8 border border-emerald-500/15 text-emerald-400"
                                    : "bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:bg-white/[0.06]"
                                }`}
                                onClick={() => handleSendFiles(m.id)}
                                disabled={loading === `files-${m.id}` || m.documentsSent}
                              >
                                {loading === `files-${m.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : m.documentsSent ? <CheckCircle2 className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                                {m.documentsSent ? "Files Sent ✓" : "Send Files"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-3">
        <p className="text-center text-[10px] text-gray-600">
          B2B Live · Auto-refreshing every 3s
        </p>
      </footer>
    </div>
  );
}
