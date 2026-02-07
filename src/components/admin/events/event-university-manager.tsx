"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Building2, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { assignUniversityToEvent, removeUniversityFromEvent, removeAllUniversitiesFromEvent } from "@/app/admin/universities/actions";

interface University {
    id: string;
    name: string;
    city: string | null;
    country: string;
}

interface ParticipatingUniversity {
    university: University;
    status: string;
    boothNumber: string | null;
}

interface EventUniversityManagerProps {
    eventId: string;
    participatingUniversities: ParticipatingUniversity[];
    allUniversities: University[];
}

export function EventUniversityManager({
    eventId,
    participatingUniversities,
    allUniversities
}: EventUniversityManagerProps) {
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [selectedUniversityId, setSelectedUniversityId] = useState("");
    const [boothNumber, setBoothNumber] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter out universities already participating
    const availableUniversities = allUniversities.filter(
        u => !participatingUniversities.some(p => p.university.id === u.id)
    );

    const handleAddUniversity = async () => {
        if (!selectedUniversityId) return;

        setIsAdding(true);
        try {
            await assignUniversityToEvent(selectedUniversityId, eventId, {
                boothNumber: boothNumber || undefined
            });
            toast.success("University added to event");
            setIsDialogOpen(false);
            setSelectedUniversityId("");
            setBoothNumber("");
            router.refresh();
        } catch (error) {
            console.error("Failed to add university:", error);
            toast.error("Failed to add university");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveUniversity = async (universityId: string) => {
        if (!confirm("Are you sure you want to remove this university from the event?")) return;

        try {
            await removeUniversityFromEvent(universityId, eventId);
            toast.success("University removed from event");
            router.refresh();
        } catch (error) {
            console.error("Failed to remove university:", error);
            toast.error("Failed to remove university");
        }
    };

    const handleRemoveAllUniversities = async () => {
        setIsDeleting(true);
        try {
            await removeAllUniversitiesFromEvent(eventId);
            toast.success(`Removed all ${participatingUniversities.length} universities from event`);
            setIsDeleteAllDialogOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Failed to remove all universities:", error);
            toast.error("Failed to remove universities");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Participating Universities</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage universities attending this event
                    </p>
                </div>
                <div className="flex gap-2">
                    {participatingUniversities.length > 0 && (
                        <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete All
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="w-5 h-5" />
                                        Remove All Universities?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This will remove <strong>{participatingUniversities.length}</strong> universities from this event.
                                        This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>Cancel</Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={handleRemoveAllUniversities}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? "Removing..." : "Yes, Remove All"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add University
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add University to Event</DialogTitle>
                            <DialogDescription>
                                Select a university to invite to this event.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>University</Label>
                                <Select
                                    value={selectedUniversityId}
                                    onValueChange={setSelectedUniversityId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select university..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUniversities.map((uni) => (
                                            <SelectItem key={uni.id} value={uni.id}>
                                                {uni.name} ({uni.country})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Booth Number (Optional)</Label>
                                <Input
                                    placeholder="e.g. A-12"
                                    value={boothNumber}
                                    onChange={(e) => setBoothNumber(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddUniversity} disabled={!selectedUniversityId || isAdding}>
                                {isAdding ? "Adding..." : "Add to Event"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {participatingUniversities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No universities assigned yet</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>University</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Booth</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participatingUniversities.map(({ university, status, boothNumber }) => (
                                <TableRow key={university.id}>
                                    <TableCell className="font-medium">{university.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-muted-foreground text-xs">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {university.city}, {university.country}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {boothNumber ? (
                                            <Badge variant="outline">{boothNumber}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={status === 'ACCEPTED' ? 'default' : 'secondary'}>
                                            {status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveUniversity(university.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
