"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { TeamForm } from "./team-form";
import { UniversityRole } from "@prisma/client";
import { Edit2, MoreHorizontal, UserMinus, UserPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteUniversityMember } from "@/lib/actions/university-team";
import { toast } from "sonner";

interface TeamActionsProps {
    member?: {
        id: string;
        name: string | null;
        email: string;
        role: UniversityRole;
    };
    currentUserId?: string;
}

export function TeamActions({ member, currentUserId }: TeamActionsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleDelete = async () => {
        if (!member) return;
        if (member.id === currentUserId) {
            toast.error("You cannot delete yourself.");
            return;
        }

        if (confirm("Are you sure you want to remove this member from your university team?")) {
            const result = await deleteUniversityMember(member.id);
            if (result.success) {
                toast.success("Team member deleted successfully");
            } else {
                toast.error(result.error);
            }
        }
    };

    if (!member) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add Member
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Team Member</DialogTitle>
                    </DialogHeader>
                    <TeamForm onSuccess={() => setIsOpen(false)} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Role
                        </DropdownMenuItem>
                    </DialogTrigger>
                    
                    {member.id !== currentUserId && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={handleDelete}
                                className="text-red-600 focus:text-red-700"
                            >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Team Member</DialogTitle>
                </DialogHeader>
                <TeamForm member={member} onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
