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
import { UserForm } from "./user-form";
import { AdminRole } from "@prisma/client";
import { Edit2, MoreHorizontal, UserMinus, UserPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteAdminUser, updateAdminUser } from "@/lib/actions/user-actions";
import { toast } from "sonner";

interface UserActionsProps {
    user?: {
        id: string;
        name: string;
        email: string;
        role: AdminRole;
        isActive: boolean;
        accessCode?: string | null;
    };
}

export function UserActions({ user }: UserActionsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleStatus = async () => {
        if (!user) return;
        const result = await updateAdminUser(user.id, { isActive: !user.isActive });
        if (result.success) {
            toast.success(`User ${user.isActive ? "deactivated" : "activated"} successfully`);
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            const result = await deleteAdminUser(user.id);
            if (result.success) {
                toast.success("User deleted successfully");
            } else {
                toast.error(result.error);
            }
        }
    };

    if (!user) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add User
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Admin User</DialogTitle>
                    </DialogHeader>
                    <UserForm onSuccess={() => setIsOpen(false)} />
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
                            Edit User
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuItem
                        onSelect={toggleStatus}
                        className={user.isActive ? "text-yellow-600" : "text-green-600"}
                    >
                        <ShieldCheckIcon className="mr-2 h-4 w-4" />
                        {user.isActive ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={handleDelete}
                        className="text-red-600"
                    >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Admin User</DialogTitle>
                </DialogHeader>
                <UserForm user={user} onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function ShieldCheckIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
