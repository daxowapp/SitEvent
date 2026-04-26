"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  GraduationCap, Clock, Timer, CheckCircle2, Users,
  Square, Loader2, Volume2, VolumeX, FileText, Send,
  Mail, Save, ChevronDown, ChevronUp,
} from "lucide-react";
import { endMeeting } from "@/app/actions/b2b-live";
import { saveMeetingNotes, emailNotesToUniversity, sendFilesToParticipant } from "@/app/actions/b2b-public";
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
  const [loading, setLoading] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notes, setNotes] = useState(data.activeMeeting?.notesA || "");
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update notes when active meeting changes
  useEffect(() => {
    setNotes(data.activeMeeting?.notesA || "");
  }, [data.activeMeeting?.id]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  // Auto-save notes with debounce
  const autoSaveNotes = useCallback((meetingId: string, value: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveMeetingNotes(token, meetingId, value);
    }, 1500);
  }, [token]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (data.activeMeeting) {
      autoSaveNotes(data.activeMeeting.id, value);
    }
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
    // Save notes before ending
    if (notes.trim()) {
      await saveMeetingNotes(token, data.activeMeeting.id, notes);
    }
    setLoading("end");
    const result = await endMeeting(data.activeMeeting.id);
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
      <div className="flex-1 p-6">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {data.activeMeeting ? (
            <Card className="border-2 border-emerald-500/50 bg-emerald-950/20">
              <CardContent className="p-6 space-y-5">
                <div className="text-center">
                  <Badge className="bg-emerald-600 text-white text-xs mb-3">NOW MEETING</Badge>
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

                {/* NOTES */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />Notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add your meeting notes here... (auto-saves)"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 min-h-[80px] resize-none"
                  />
                  <p className="text-[10px] text-gray-600">Auto-saves as you type</p>
                </div>

                <div className="flex gap-2">
                  {/* SEND FILES */}
                  {data.universityFiles.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/20 gap-1.5 text-xs"
                      onClick={() => handleSendFiles(data.activeMeeting!.id)}
                      disabled={loading === `files-${data.activeMeeting!.id}`}
                    >
                      {loading === `files-${data.activeMeeting!.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Send Files ({data.universityFiles.length})
                    </Button>
                  )}

                  {/* END MEETING */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20 gap-1.5 text-xs"
                    onClick={handleEndMeeting}
                    disabled={loading === "end"}
                  >
                    {loading === "end" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
                    End Meeting
                  </Button>
                </div>

                {data.waitingCount > 0 && (
                  <p className="text-sm text-amber-400 text-center">
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

          {/* EMAIL ALL NOTES */}
          {data.completedMeetings.length > 0 && (
            <Button
              variant="outline"
              className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20 gap-2"
              onClick={handleEmailNotes}
              disabled={loading === "email"}
            >
              {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Email All Notes to Me
            </Button>
          )}

          {/* COMPLETED MEETINGS */}
          {data.completedMeetings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />Completed ({data.completedMeetings.length})
              </h3>
              <div className="space-y-2">
                {data.completedMeetings.map((m) => {
                  const duration = m.actualStart && m.actualEnd
                    ? Math.round((new Date(m.actualEnd).getTime() - new Date(m.actualStart).getTime()) / 60000)
                    : null;
                  const isExpanded = expandedMeeting === m.id;
                  const editNote = editingNotes[m.id] ?? m.notesA;

                  return (
                    <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                        onClick={() => setExpandedMeeting(isExpanded ? null : m.id)}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <div className="text-left">
                            <span className="text-sm text-gray-300">{m.participantB.name}</span>
                            {m.notesA && <FileText className="h-3 w-3 text-blue-400 inline ml-2" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {duration && `${duration}min`}
                          </span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-800 px-4 py-3 space-y-3">
                          {m.participantB.organization && (
                            <p className="text-xs text-gray-400">{m.participantB.organization} {m.participantB.country && `· ${m.participantB.country}`}</p>
                          )}

                          {/* Edit notes */}
                          <Textarea
                            value={editNote}
                            onChange={(e) => setEditingNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder="Add notes for this meeting..."
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 min-h-[60px] text-sm resize-none"
                          />

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20 gap-1 text-xs flex-1"
                              onClick={() => handleSaveNotes(m.id, editNote)}
                              disabled={loading === `save-${m.id}`}
                            >
                              {loading === `save-${m.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              Save Notes
                            </Button>

                            {data.universityFiles.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`gap-1 text-xs flex-1 ${m.documentsSent ? "border-emerald-500/50 text-emerald-400" : "border-gray-600 text-gray-400 hover:bg-gray-700"}`}
                                onClick={() => handleSendFiles(m.id)}
                                disabled={loading === `files-${m.id}` || m.documentsSent}
                              >
                                {loading === `files-${m.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : m.documentsSent ? <CheckCircle2 className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                                {m.documentsSent ? "Files Sent ✓" : "Send Files"}
                              </Button>
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
    </div>
  );
}
