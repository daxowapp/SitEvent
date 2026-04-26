"use client";

import { useState } from "react";
import { format } from "date-fns";

function fmtUTC(date: Date, fmt: string): string {
  const d = new Date(date);
  if (fmt === "HH:mm") {
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  return format(d, fmt);
}
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar, Clock, MapPin, ArrowLeft, Building2,
  FileText, CheckCircle2, Send, Loader2, Radio,
} from "lucide-react";
import Link from "next/link";
import { updateMeetingNotes, markDocumentsSent } from "@/app/actions/b2b";

type ParticipantData = NonNullable<
  Awaited<ReturnType<typeof import("@/app/actions/b2b").getUniversityB2BSchedule>>
>;

export function B2BUniversityScheduleClient({
  participant,
}: {
  participant: ParticipantData;
}) {
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState("");
  const event = participant.b2bEvent;

  const handleSaveNotes = async () => {
    if (!selectedMeeting) return;
    setLoading("notes");
    const result = await updateMeetingNotes(selectedMeeting.id, notes, "A");
    if (result.error) toast.error(result.error);
    else toast.success("Notes saved!");
    setLoading("");
  };

  const handleSendDocs = async (meetingId: string) => {
    setLoading(`docs-${meetingId}`);
    const result = await markDocumentsSent(meetingId);
    if (result.error) toast.error(result.error);
    else toast.success("Documents marked as sent!");
    setLoading("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="../b2b">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(event.date), "MMM d, yyyy")}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{event.startTime} — {event.endTime}</span>
              {event.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>}
            </div>
          </div>
        </div>
        {participant.scheduleToken && (
          <Link href={`/b2b/university/${participant.scheduleToken}`} target="_blank">
            <Button className="bg-red-600 hover:bg-red-700 gap-2">
              <Radio className="h-4 w-4 animate-pulse" />
              Go Live
            </Button>
          </Link>
        )}
      </div>

      {/* Meeting Count */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Your meetings today</p>
        <p className="text-3xl font-bold text-primary">{participant.meetingsAsA.length}</p>
      </div>

      {/* Schedule */}
      {participant.meetingsAsA.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No meetings scheduled yet. The organizer will generate the schedule.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {participant.meetingsAsA.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border bg-card p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={() => { setSelectedMeeting(m); setNotes(m.notesA || ""); }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[80px]">
                    <p className="text-lg font-bold text-primary">
                      {fmtUTC(new Date(m.timeSlot), "HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtUTC(new Date(m.endTime), "HH:mm")}
                    </p>
                  </div>
                  <div className="border-l pl-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      <p className="font-semibold">{m.participantB.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[m.participantB.organization, m.participantB.country].filter(Boolean).join(" · ")}
                    </p>
                    {m.participantB.contactPerson && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Contact: {m.participantB.contactPerson}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {m.tableNumber && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      Table {m.tableNumber}
                    </span>
                  )}
                  {m.documentsSent && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  {m.notesA && <FileText className="h-4 w-4 text-blue-600" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meeting Detail Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              {selectedMeeting?.participantB.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Time</p><p className="font-medium">{format(new Date(selectedMeeting.timeSlot), "HH:mm")} — {format(new Date(selectedMeeting.endTime), "HH:mm")}</p></div>
                {selectedMeeting.tableNumber && <div><p className="text-muted-foreground">Table</p><p className="font-medium">Table {selectedMeeting.tableNumber}</p></div>}
                {selectedMeeting.participantB.contactPerson && <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{selectedMeeting.participantB.contactPerson}</p></div>}
                {selectedMeeting.participantB.contactEmail && <div><p className="text-muted-foreground">Email</p><p className="font-medium text-xs">{selectedMeeting.participantB.contactEmail}</p></div>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Meeting Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this meeting..." rows={4} />
                <Button size="sm" onClick={handleSaveNotes} disabled={loading === "notes"} className="gap-2">
                  {loading === "notes" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  Save Notes
                </Button>
              </div>

              <div className="border-t pt-3">
                <Button
                  variant={selectedMeeting.documentsSent ? "outline" : "default"}
                  size="sm"
                  className="gap-2 w-full"
                  onClick={() => handleSendDocs(selectedMeeting.id)}
                  disabled={loading === `docs-${selectedMeeting.id}` || selectedMeeting.documentsSent}
                >
                  {selectedMeeting.documentsSent ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />Documents Sent</>
                  ) : loading === `docs-${selectedMeeting.id}` ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="h-3.5 w-3.5" />Send Documents to Participant</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
