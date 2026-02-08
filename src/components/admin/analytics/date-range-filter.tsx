"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateRange } from "@/app/admin/analytics/actions";

interface DateRangeFilterProps {
    className?: string;
}

export function DateRangeFilter({ className }: DateRangeFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Default to '7d' if not specified
    const currentRange = (searchParams.get("range") as DateRange) || "7d";

    const ranges: { value: DateRange; label: string }[] = [
        { value: "7d", label: "7 Days" },
        { value: "30d", label: "30 Days" },
        { value: "90d", label: "90 Days" },
        { value: "1y", label: "1 Year" },
        { value: "all", label: "All Time" },
    ];

    const handleRangeChange = (range: DateRange) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", range);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className={cn("flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200", className)}>
            {ranges.map((range) => (
                <Button
                    key={range.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRangeChange(range.value)}
                    className={cn(
                        "rounded-md text-sm font-medium transition-all hover:bg-white hover:text-slate-900",
                        currentRange === range.value
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:bg-slate-200/50"
                    )}
                >
                    {range.label}
                </Button>
            ))}
        </div>
    );
}
