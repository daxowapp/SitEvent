"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
    return (
        <Button className="w-full" variant="outline" onClick={() => window.print()}>
            🖨️ Print Pass
        </Button>
    );
}
