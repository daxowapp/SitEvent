"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SessionForm } from "./session-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { duplicateSession } from "@/app/actions/events";

interface Session {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    location: string | null;
    speaker: string | null;
}

interface EventSessionsListProps {
    eventId: string;
    sessions: Session[];
}

export function EventSessionsList({ eventId, sessions: initialSessions }: EventSessionsListProps) {
    const [sessions, setSessions] = useState<Session[]>(initialSessions);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);

    const router = useRouter();

    const handleCreate = async (data: any) => {
        try {
            const response = await fetch(`/api/admin/events/${eventId}/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to create session");

            const newSession = await response.json();
            setSessions([...sessions, { ...newSession, startTime: new Date(newSession.startTime), endTime: new Date(newSession.endTime) }]);
            setIsDialogOpen(false);
            toast.success("Session created successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to create session");
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingSession) return;
        try {
            const response = await fetch(`/api/admin/events/${eventId}/sessions/${editingSession.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to update session");

            const updatedSession = await response.json();
            setSessions(sessions.map((s) => (s.id === editingSession.id ? { ...updatedSession, startTime: new Date(updatedSession.startTime), endTime: new Date(updatedSession.endTime) } : s)));
            setIsDialogOpen(false);
            setEditingSession(null);
            toast.success("Session updated successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update session");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;
        try {
            const response = await fetch(`/api/admin/events/${eventId}/sessions/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete session");

            setSessions(sessions.filter((s) => s.id !== id));
            toast.success("Session deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete session");
        }
    };

    const handleDuplicate = async (sessionId: string) => {
        if (!confirm("Are you sure you want to duplicate this session?")) return;
        try {
            const result = await duplicateSession(sessionId, eventId);
            if (result.success && result.session) {
                const newSession = result.session;
                // Add to local state to update UI immediately
                setSessions([...sessions, { ...newSession, startTime: new Date(newSession.startTime), endTime: new Date(newSession.endTime) }]);
                toast.success("Session duplicated successfully");
                router.refresh();
            } else {
                 throw new Error(result.error || "Failed to duplicate");
            }
        } catch (error) {
            console.error("Duplicate error:", error);
            toast.error("Failed to duplicate session");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Event Program</h3>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingSession(null);
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingSession(null)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Session
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingSession ? "Edit Session" : "New Session"}</DialogTitle>
                        </DialogHeader>
                        <SessionForm
                            defaultValues={editingSession ? {
                                ...editingSession,
                                description: editingSession.description || undefined,
                                location: editingSession.location || undefined,
                                speaker: editingSession.speaker || undefined,
                            } : undefined}
                            onSubmit={editingSession ? handleUpdate : handleCreate}
                            onCancel={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Speaker</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No sessions defined yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions
                                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                                .map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="font-medium">{format(session.startTime, "HH:mm")}</span>
                                                <span className="text-muted-foreground text-xs">{format(session.endTime, "HH:mm")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{session.title}</div>
                                            {session.description && session.description.toLowerCase() !== session.title.toLowerCase() && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {session.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{session.speaker || "-"}</TableCell>
                                        <TableCell>{session.location || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingSession(session);
                                                        setIsDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(session.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Duplicate Session"
                                                    onClick={() => handleDuplicate(session.id)}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
