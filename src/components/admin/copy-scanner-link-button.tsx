"use client";

import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CopyScannerLinkButtonProps {
    eventId: string;
}

export function CopyScannerLinkButton({ eventId }: CopyScannerLinkButtonProps) {

    const handleCopy = () => {
        // Construct the URL
        // 1. Target destination: /admin/scan?eventId=...
        const targetPath = `/admin/scan?eventId=${eventId}`;
        
        // 2. Auth wrapping: /scan-login?callbackUrl=... matches the Usher Login flow
        // We use encodeURIComponent to ensure special chars in the target path don't break the query param
        const fullUrl = `${window.location.origin}/scan-login?callbackUrl=${encodeURIComponent(targetPath)}`;

        navigator.clipboard.writeText(fullUrl).then(() => {
            toast.success("Scanner Link Copied!", {
                description: "Link includes auto-login redirect and event selection."
            });
        }).catch(() => {
            toast.error("Failed to copy link");
        });
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                        <QrCode className="w-4 h-4 mr-2" />
                        Scanner Link
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Copy fast login link for Ushers</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
