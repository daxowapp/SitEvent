"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestEventAccess } from "@/app/actions/university-event";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

interface RegisterEventButtonProps {
    eventId: string;
    variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    text?: string;
}

export function RegisterEventButton({ 
    eventId, 
    variant = "default", 
    size = "default", 
    className,
    text = "Request Access"
}: RegisterEventButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRegister = () => {
        startTransition(async () => {
            const result = await requestEventAccess(eventId);
            
            if (result.success) {
                setIsSuccess(true);
                toast.success("Request sent successfully", {
                    description: "An admin will review your request shortly."
                });
            } else {
                toast.error("Registration failed", {
                    description: result.error
                });
            }
        });
    };

    if (isSuccess) {
        return (
            <Button disabled variant="outline" size={size} className="gap-2 text-green-600 border-green-200">
                <CheckCircle2 className="h-4 w-4" /> Requested
            </Button>
        );
    }

    return (
        <Button 
            onClick={handleRegister} 
            disabled={isPending}
            variant={variant}
            size={size}
            className={className}
        >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {text}
        </Button>
    );
}
