'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface DeleteEventButtonProps {
    eventId: string;
    eventTitle: string;
    onDelete: () => Promise<void>;
}

export function DeleteEventButton({ eventId, eventTitle, onDelete }: DeleteEventButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            await onDelete();
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Event
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>"{eventTitle}"</strong>?
                        This will permanently remove the event and all associated registrations,
                        check-ins, and message logs. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? 'Deleting...' : 'Yes, Delete Event'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
