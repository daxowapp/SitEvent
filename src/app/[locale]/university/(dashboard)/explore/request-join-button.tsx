"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, PlusCircle, Check } from "lucide-react";
import { requestJoinEvent } from "@/lib/actions/university-actions";

export default function RequestJoinButton({ eventId }: { eventId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isRequested, setIsRequested] = useState(false);

    async function handleRequest() {
        setIsLoading(true);
        try {
            const result = await requestJoinEvent(eventId);
            if (result.success) {
                toast.success("Request sent successfully!");
                setIsRequested(true);
            } else {
                toast.error(result.error || "Failed to send request");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    if (isRequested) {
        return (
            <Button variant="outline" className="w-full text-green-600 border-green-200 bg-green-50" disabled>
                <Check className="mr-2 h-4 w-4" /> Requested
            </Button>
        );
    }

    return (
        <Button className="w-full" onClick={handleRequest} disabled={isLoading}>
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
            ) : (
                <>
                    <PlusCircle className="mr-2 h-4 w-4" /> Request to Join
                </>
            )}
        </Button>
    );
}
