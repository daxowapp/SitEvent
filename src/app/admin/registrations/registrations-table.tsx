"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link"; // For future linking to details

interface RegistrationsTableProps {
    registrations: any[];
    events: { id: string; title: string }[];
    pageCount: number;
    currentPage: number;
    sources: string[];
}

export function RegistrationsTable({
    registrations,
    events,
    pageCount,
    currentPage,
    sources,
}: RegistrationsTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const updateParam = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set("page", "1"); // Reset to page 1 on filter change
        startTransition(() => {
            router.replace(`?${params.toString()}`);
        });
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Debounce simple implementation could differ, but here we just update for simplicity 
        // In real app, consider useDebounce
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set("q", value);
        } else {
            params.delete("q");
        }
        params.set("page", "1");
        startTransition(() => {
            router.replace(`?${params.toString()}`);
        });
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-8"
                        onChange={handleSearch}
                        defaultValue={searchParams.get("q")?.toString()}
                    />
                </div>
                <Select
                    onValueChange={(val) => updateParam("eventId", val === "ALL" ? null : val)}
                    defaultValue={searchParams.get("eventId") || "ALL"}
                >
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Events</SelectItem>
                        {events.map((evt) => (
                            <SelectItem key={evt.id} value={evt.id}>
                                {evt.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(val) => updateParam("source", val === "ALL" ? null : val)}
                    defaultValue={searchParams.get("source") || "ALL"}
                >
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Sources</SelectItem>
                        {sources.map((src) => (
                            <SelectItem key={src} value={src}>
                                {src}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(val) => updateParam("status", val === "ALL" ? null : val)}
                    defaultValue={searchParams.get("status") || "ALL"}
                >
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="REGISTERED">Registered</SelectItem>
                        <SelectItem value="Attended">Attended</SelectItem> {/* If we have accurate status mapping */}
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white relative">
                {isPending && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Registrant</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Source / Medium</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Check-in</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No registrations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrations.map((reg) => (
                                <TableRow key={reg.id}>
                                    <TableCell>
                                        <div className="font-medium">{reg.registrant.fullName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {reg.registrant.email}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={reg.event.title}>
                                        {reg.event.title}
                                    </TableCell>
                                    <TableCell className="max-w-[150px]">
                                        <div className="text-xs font-medium truncate" title={reg.registrant.utmSource || ""}>
                                            {reg.registrant.utmSource || "-"}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate" title={reg.registrant.utmMedium || ""}>
                                            {reg.registrant.utmMedium}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground" title={reg.registrant.utmCampaign || ""}>
                                        {reg.registrant.utmCampaign || "-"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(reg.createdAt), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                reg.status === "REGISTERED"
                                                    ? "default"
                                                    : reg.status === "CANCELLED"
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                        >
                                            {reg.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={reg.checkIn ? "outline" : "secondary"} className={reg.checkIn ? "bg-green-50 text-green-700 border-green-200" : "opacity-50"}>
                                            {reg.checkIn ? "Checked In" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/registrations/${reg.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination controls can be added here */}
            {pageCount > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("page", String(currentPage - 1));
                            startTransition(() => router.replace(`?${params.toString()}`));
                        }}
                        disabled={currentPage <= 1 || isPending}
                    >
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {currentPage} of {pageCount}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("page", String(currentPage + 1));
                            startTransition(() => router.replace(`?${params.toString()}`));
                        }}
                        disabled={currentPage >= pageCount || isPending}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
