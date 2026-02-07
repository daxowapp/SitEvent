"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { duplicateEvent } from "@/app/actions/events";
import { toast } from "sonner";

interface DuplicateEventButtonProps {
    eventId: string;
}

export function DuplicateEventButton({ eventId }: DuplicateEventButtonProps) {
    const router = useRouter();
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleDuplicate = async () => {
         if (!confirm("Are you sure you want to duplicate this event?")) return;

         setIsDuplicating(true);
         try {
             const result = await duplicateEvent(eventId);
             if (result.success && result.eventId) {
                 toast.success("Event duplicated successfully!");
                 router.push(`/admin/events/${result.eventId}`);
             } else {
                 throw new Error(result.error || "Failed to duplicate");
             }
         } catch (error) {
             console.error("Duplicate error:", error);
             toast.error("Failed to duplicate event");
             setIsDuplicating(false);
         }
    };

    return (
        <Button 
            type="button" 
            variant="outline" 
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="gap-2"
        >
            <Copy className="h-4 w-4" />
            {isDuplicating ? "Duplicating..." : "Duplicate"}
        </Button>
    );
}
