"use client";

import { useTransition } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicateEvent } from "@/app/actions/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DuplicateEventButton({ eventId }: { eventId: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDuplicate = () => {
        startTransition(async () => {
            const result = await duplicateEvent(eventId);
            if (result.success) {
                toast.success("Event duplicated successfully");
                // Optional: redirect to the new event edit page
                // router.push(`/admin/events/${result.eventId}`); 
            } else {
                toast.error(result.error || "Failed to duplicate event");
            }
        });
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            disabled={isPending}
            title="Duplicate Event"
        >
            <Copy className="w-4 h-4" />
            <span className="sr-only">Duplicate</span>
        </Button>
    );
}
