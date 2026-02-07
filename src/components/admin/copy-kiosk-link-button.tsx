"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CopyKioskLinkButtonProps {
    slug: string;
    city?: string | null;
    country?: string | null;
}

export function CopyKioskLinkButton({ slug, city, country }: CopyKioskLinkButtonProps) {

    const handleCopy = () => {
        // Determine Locale
        let locale = "en";
        const c = (city || "").toLowerCase();
        const co = (country || "").toLowerCase();

        if (["turkey", "istanbul", "ankara", "izmir"].some(x => co.includes(x) || c.includes(x))) {
            locale = "tr";
        } else if (["egypt", "cairo", "alexandria", "saudi", "uae", "jordan"].some(x => co.includes(x) || c.includes(x))) {
            locale = "ar";
        }

        const url = `${window.location.origin}/${locale}/kiosk/${slug}`;

        navigator.clipboard.writeText(url).then(() => {
            toast.success("Kiosk Link Copied!", {
                description: `Ready to share: ${url}`
            });
        }).catch(() => {
            toast.error("Failed to copy link");
        });
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Copy className="w-4 h-4 mr-2" />
                        Kiosk Link
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Copy link for Ushers</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
