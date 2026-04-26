"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// UTC-safe time formatter (avoids local timezone offset)
function fmtUTC(date: Date, fmt: string): string {
  const d = new Date(date);
  if (fmt === "HH:mm") {
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  return format(d, fmt);
}
import { toast } from "sonner";
import Link from "next/link";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Plus, Trash2, Upload,
  Wand2, Download, Loader2, GraduationCap, Building2, FileSpreadsheet,
  CheckCircle2, XCircle, AlertTriangle, Pencil,
} from "lucide-react";
import {
  addUniversityToB2B, addParticipantB, removeParticipant,
  generateB2BSchedule, clearB2BSchedule, importParticipantsB,
  deleteB2BEvent, updateMeetingStatus, updateB2BEvent, updateParticipantB,
} from "@/app/actions/b2b";

type EventData = NonNullable<Awaited<ReturnType<typeof import("@/app/actions/b2b").getB2BEvent>>>;

export function B2BEventDetailClient({ event }: { event: EventData }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [showAddUni, setShowAddUni] = useState(false);
  const [showAddB, setShowAddB] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [availableUnis, setAvailableUnis] = useState<any[]>([]);

  const sideA = event.participants.filter((p) => p.side === "A");
  const sideB = event.participants.filter((p) => p.side === "B");

  // Group meetings by time slot
  const meetingsBySlot = event.meetings.reduce((acc, m) => {
    const key = new Date(m.timeSlot).toISOString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, typeof event.meetings>);

  const handleLoadUnis = async () => {
    const res = await fetch(`/api/admin/b2b/${event.id}/universities`);
    if (res.ok) setAvailableUnis(await res.json());
    setShowAddUni(true);
  };

  const handleAddUni = async (uniId: string) => {
    setLoading("addUni");
    const result = await addUniversityToB2B(event.id, uniId);
    if (result.error) toast.error(result.error);
    else { toast.success("University added!"); setShowAddUni(false); router.refresh(); }
    setLoading("");
  };

  const handleAddParticipantB = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("addB");
    const formData = new FormData(e.currentTarget);
    const result = await addParticipantB(event.id, formData);
    if (result.error) toast.error(result.error);
    else { toast.success("Participant added!"); setShowAddB(false); router.refresh(); }
    setLoading("");
  };

  const handleEditEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("editEvent");
    const formData = new FormData(e.currentTarget);
    const result = await updateB2BEvent(event.id, formData);
    if (result.error) toast.error(result.error);
    else { toast.success("Event updated!"); setShowEditEvent(false); router.refresh(); }
    setLoading("");
  };

  const handleEditParticipant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingParticipant) return;
    setLoading("editPart");
    const formData = new FormData(e.currentTarget);
    const result = await updateParticipantB(editingParticipant.id, formData);
    if (result.error) toast.error(result.error);
    else { toast.success("Participant updated!"); setEditingParticipant(null); router.refresh(); }
    setLoading("");
  };

  const handleRemove = async (id: string) => {
    setLoading(`remove-${id}`);
    const result = await removeParticipant(id);
    if (result.error) toast.error(result.error);
    else { toast.success("Removed!"); router.refresh(); }
    setLoading("");
  };

  const handleGenerate = async () => {
    setLoading("generate");
    const result = await generateB2BSchedule(event.id);
    if (result.error) toast.error(result.error);
    else {
      if (result.adjusted) toast.info(result.adjusted, { duration: 8000 });
      toast.success(`${result.meetingsCreated} meetings scheduled!`);
      router.refresh();
    }
    setLoading("");
  };

  const handleClear = async () => {
    setLoading("clear");
    const result = await clearB2BSchedule(event.id);
    if (result.error) toast.error(result.error);
    else { toast.success("Schedule cleared"); router.refresh(); }
    setLoading("");
  };

  const handleDelete = async () => {
    setLoading("delete");
    const result = await deleteB2BEvent(event.id);
    if (result.error) toast.error(result.error);
    else { toast.success("Event deleted"); router.push("/admin/b2b"); }
    setLoading("");
  };

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("import");
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (!file) { toast.error("Select a file"); setLoading(""); return; }

    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) { toast.error("File must have header + data rows"); setLoading(""); return; }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    const participants = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
      return {
        name: obj.name || obj.company || obj.organization || obj.institution_name || obj["institution name"] || "",
        contactPerson: obj.contact_person || obj.contactperson || obj.person || obj.attendance_name || obj["attendance name"] || "",
        contactEmail: obj.email || obj.contact_email || "",
        contactPhone: obj.phone || obj.contact_phone || "",
        organization: obj.type || obj.organization_type || obj.org_type || "",
        country: obj.country || "",
        notes: obj.notes || "",
        arrivalTime: obj.arrival_time || obj.arrivaltime || obj.arrival || obj.attendance_time || obj["attendance time"] || "",
      };
    }).filter(p => p.name);

    if (participants.length === 0) { toast.error("No valid rows found"); setLoading(""); return; }

    const result = await importParticipantsB(event.id, participants);
    if (result.error) toast.error(result.error);
    else { toast.success(`${result.count} participants imported!`); setShowImport(false); router.refresh(); }
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/b2b">
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
        <div className="flex items-center gap-2">
          {event.isScheduleGenerated && (
            <a href={`/api/admin/b2b/${event.id}/export?format=csv`} download>
              <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
            </a>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEditEvent(true)}>
            <Pencil className="h-4 w-4" />Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2"><Trash2 className="h-4 w-4" />Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this B2B event?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the event, all participants, and all meeting data.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  {loading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Universities", value: sideA.length, icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
          { label: "Participants", value: sideB.length, icon: Building2, color: "text-purple-600 bg-purple-50" },
          { label: "Meetings", value: event.meetings.length, icon: Users, color: "text-emerald-600 bg-emerald-50" },
          { label: "Slot Duration", value: `${event.slotDuration}m`, icon: Clock, color: "text-amber-600 bg-amber-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="participants">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="links">Public Links</TabsTrigger>
        </TabsList>

        {/* PARTICIPANTS TAB */}
        <TabsContent value="participants" className="space-y-6 mt-4">
          {/* Side A */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-600" />Side A — Universities ({sideA.length})</h3>
              <Button size="sm" className="gap-2" onClick={handleLoadUnis}><Plus className="h-4 w-4" />Add University</Button>
            </div>
            {sideA.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No universities added yet. Click &quot;Add University&quot; to get started.</p>
            ) : (
              <div className="space-y-2">
                {sideA.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {p.university?.logoUrl ? (
                        <img src={p.university.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><GraduationCap className="h-4 w-4 text-blue-600" /></div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        {p.country && <p className="text-xs text-muted-foreground">{p.country}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemove(p.id)} disabled={loading === `remove-${p.id}`}>
                      {loading === `remove-${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side B */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-5 w-5 text-purple-600" />Side B — Participants ({sideB.length})</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowImport(true)}><Upload className="h-4 w-4" />Import CSV</Button>
                <Button size="sm" className="gap-2" onClick={() => setShowAddB(true)}><Plus className="h-4 w-4" />Add Participant</Button>
              </div>
            </div>
            {sideB.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No participants added yet. Add manually or import from CSV.</p>
            ) : (
              <div className="space-y-2">
                {sideB.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[p.organization, p.contactPerson, p.country].filter(Boolean).join(" · ")}
                        {p.arrivalTime && <span className="ml-2 inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium"><Clock className="h-2.5 w-2.5" />{p.arrivalTime}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingParticipant(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemove(p.id)} disabled={loading === `remove-${p.id}`}>
                        {loading === `remove-${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SCHEDULE TAB */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Meeting Schedule</h3>
              <p className="text-sm text-muted-foreground">
                {event.isScheduleGenerated
                  ? `${event.meetings.length} meetings across ${Object.keys(meetingsBySlot).length} time slots`
                  : "Generate a schedule to assign meetings automatically"}
              </p>
            </div>
            <div className="flex gap-2">
              {event.isScheduleGenerated && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2"><XCircle className="h-4 w-4" />Clear Schedule</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear schedule?</AlertDialogTitle>
                      <AlertDialogDescription>This will delete all meeting assignments. You can regenerate the schedule after.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClear}>Clear</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button size="sm" className="gap-2" onClick={handleGenerate} disabled={loading === "generate" || sideA.length === 0 || sideB.length === 0}>
                {loading === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {event.isScheduleGenerated ? "Regenerate" : "Generate Schedule"}
              </Button>
            </div>
          </div>

          {!event.isScheduleGenerated && sideA.length > 0 && sideB.length > 0 && (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <Wand2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-3 font-medium">Ready to generate</p>
              <p className="text-sm text-muted-foreground mt-1">
                {sideA.length} universities × {sideB.length} participants = {sideA.length * sideB.length} meetings needed
              </p>
              <Button className="mt-4 gap-2" onClick={handleGenerate} disabled={loading === "generate"}>
                {loading === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate Schedule
              </Button>
            </div>
          )}

          {event.isScheduleGenerated && Object.keys(meetingsBySlot).length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Time</th>
                      <th className="text-left p-3 font-medium">Table</th>
                      <th className="text-left p-3 font-medium">University (A)</th>
                      <th className="text-left p-3 font-medium">Participant (B)</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(meetingsBySlot).sort(([a], [b]) => a.localeCompare(b)).map(([slot, meetings]) => (
                      meetings.map((m, idx) => (
                        <tr key={m.id} className={`border-b hover:bg-muted/30 transition-colors ${idx === 0 ? "border-t-2 border-t-primary/10" : ""}`}>
                          {idx === 0 && (
                            <td className="p-3 font-medium align-top whitespace-nowrap" rowSpan={meetings.length}>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {fmtUTC(new Date(m.timeSlot), "HH:mm")} — {fmtUTC(new Date(m.endTime), "HH:mm")}
                              </div>
                            </td>
                          )}
                          <td className="p-3"><span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">{m.tableNumber}</span></td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {m.participantA.university?.logoUrl ? (
                                <img src={m.participantA.university.logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center"><GraduationCap className="h-3 w-3 text-blue-600" /></div>
                              )}
                              <span>{m.participantA.university?.name || m.participantA.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <span className="font-medium">{m.participantB.name}</span>
                              {m.participantB.organization && <span className="text-xs text-muted-foreground ml-1">({m.participantB.organization})</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <Select defaultValue={m.status} onValueChange={(v) => updateMeetingStatus(m.id, v as any)}>
                              <SelectTrigger className="h-7 w-[120px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                <SelectItem value="NO_SHOW">No Show</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* PUBLIC LINKS TAB */}
        <TabsContent value="links" className="space-y-4 mt-4">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-2">Side B Public Schedule Links</h3>
            <p className="text-sm text-muted-foreground mb-4">Share these links with Side B participants so they can view their schedules without logging in.</p>
            {sideB.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No Side B participants yet.</p>
            ) : (
              <div className="space-y-2">
                {sideB.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.organization}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                        /b2b/schedule/{p.scheduleToken}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/b2b/schedule/${p.scheduleToken}`);
                        toast.success("Link copied!");
                      }}>Copy</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ADD UNIVERSITY DIALOG */}
      <Dialog open={showAddUni} onOpenChange={setShowAddUni}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add University</DialogTitle></DialogHeader>
          {availableUnis.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">All universities are already added or none found.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableUnis.map((uni: any) => (
                <div key={uni.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {uni.logoUrl ? <img src={uni.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> :
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><GraduationCap className="h-4 w-4 text-blue-600" /></div>}
                    <div><p className="font-medium text-sm">{uni.name}</p><p className="text-xs text-muted-foreground">{uni.country}</p></div>
                  </div>
                  <Button size="sm" onClick={() => handleAddUni(uni.id)} disabled={loading === "addUni"}>Add</Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD PARTICIPANT B DIALOG */}
      <Dialog open={showAddB} onOpenChange={setShowAddB}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Participant (Side B)</DialogTitle></DialogHeader>
          <form onSubmit={handleAddParticipantB} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="pb-name">Name *</Label><Input id="pb-name" name="name" required placeholder="Company or Agent name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="pb-person">Contact Person</Label><Input id="pb-person" name="contactPerson" /></div>
              <div className="space-y-2"><Label htmlFor="pb-org">Type</Label>
                <Select name="organization"><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent><SelectItem value="Agent">Agent</SelectItem><SelectItem value="School">School</SelectItem><SelectItem value="Company">Company</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="pb-email">Email</Label><Input id="pb-email" name="contactEmail" type="email" /></div>
              <div className="space-y-2"><Label htmlFor="pb-phone">Phone</Label><Input id="pb-phone" name="contactPhone" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="pb-country">Country</Label><Input id="pb-country" name="country" /></div>
              <div className="space-y-2"><Label htmlFor="pb-arrival">Arrival Time</Label><Input id="pb-arrival" name="arrivalTime" type="time" placeholder="e.g. 12:00" /></div>
            </div>
            <Button type="submit" className="w-full" disabled={loading === "addB"}>
              {loading === "addB" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add Participant
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* IMPORT CSV DIALOG */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import Participants from CSV</DialogTitle></DialogHeader>
          <form onSubmit={handleImport} className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium">Upload CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">Headers: name, contact_person, email, phone, type, country</p>
              <Input name="file" type="file" accept=".csv" className="mt-3 mx-auto max-w-xs" />
            </div>
            <Button type="submit" className="w-full" disabled={loading === "import"}>
              {loading === "import" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}Import
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* EDIT EVENT DIALOG */}
      <Dialog open={showEditEvent} onOpenChange={setShowEditEvent}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit B2B Event</DialogTitle></DialogHeader>
          <form onSubmit={handleEditEvent} className="space-y-4">
            <div className="space-y-2"><Label>Event Name</Label><Input name="name" defaultValue={event.name} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input name="slug" defaultValue={event.slug} required /></div>
            <div className="space-y-2"><Label>Date</Label><Input name="date" type="date" defaultValue={new Date(event.date).toISOString().split('T')[0]} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Start Time</Label><Input name="startTime" type="time" defaultValue={event.startTime} required /></div>
              <div className="space-y-2"><Label>End Time</Label><Input name="endTime" type="time" defaultValue={event.endTime} required /></div>
            </div>
            <div className="space-y-2"><Label>Slot Duration (minutes)</Label><Input name="slotDuration" type="number" min={5} max={120} defaultValue={event.slotDuration} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Break Start</Label><Input name="breakStart" type="time" defaultValue={event.breakStart || ''} /></div>
              <div className="space-y-2"><Label>Break End</Label><Input name="breakEnd" type="time" defaultValue={event.breakEnd || ''} /></div>
            </div>
            <div className="space-y-2"><Label>Location</Label><Input name="location" defaultValue={event.location || ''} /></div>
            <Button type="submit" className="w-full" disabled={loading === "editEvent"}>
              {loading === "editEvent" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PARTICIPANT DIALOG */}
      <Dialog open={!!editingParticipant} onOpenChange={(open) => !open && setEditingParticipant(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Participant</DialogTitle></DialogHeader>
          {editingParticipant && (
            <form onSubmit={handleEditParticipant} className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input name="name" defaultValue={editingParticipant.name} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Contact Person</Label><Input name="contactPerson" defaultValue={editingParticipant.contactPerson || ''} /></div>
                <div className="space-y-2"><Label>Type</Label>
                  <Select name="organization" defaultValue={editingParticipant.organization || ''}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent><SelectItem value="Agent">Agent</SelectItem><SelectItem value="School">School</SelectItem><SelectItem value="Company">Company</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Email</Label><Input name="contactEmail" type="email" defaultValue={editingParticipant.contactEmail || ''} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input name="contactPhone" defaultValue={editingParticipant.contactPhone || ''} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Country</Label><Input name="country" defaultValue={editingParticipant.country || ''} /></div>
                <div className="space-y-2">
                  <Label>Arrival Time</Label>
                  <Input name="arrivalTime" type="time" defaultValue={editingParticipant.arrivalTime || ''} />
                  <p className="text-[10px] text-muted-foreground">Leave empty = available from event start</p>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading === "editPart"}>
                {loading === "editPart" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
