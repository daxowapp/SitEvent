"use client";

import { useTransition } from "react";
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
import { DataTableToolbar } from "./data-table-toolbar";

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

    return (
        <div className="space-y-4">
            <DataTableToolbar
                searchQuery={searchParams.get("q")?.toString() || ""}
                setSearchQuery={(val) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (val) {
                        params.set("q", val);
                    } else {
                        params.delete("q");
                    }
                    params.set("page", "1");
                    startTransition(() => {
                        router.replace(`?${params.toString()}`);
                    });
                }}
                eventId={searchParams.get("eventId")}
                setEventId={(val) => updateParam("eventId", val)}
                status={searchParams.get("status")}
                setStatus={(val) => updateParam("status", val)}
                source={searchParams.get("source")}
                setSource={(val) => updateParam("source", val)}
                events={events}
                sources={sources}
                sort={searchParams.get("sort") || "desc"}
                setSort={(val) => updateParam("sort", val)}
            />

            <div className="rounded-md border bg-white relative">
                {isPending && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Interest</TableHead>
                            <TableHead>Source / Medium</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Check-in</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registrations.map((reg) => (
                            <TableRow key={reg.id}>
                                <TableCell className="font-medium">
                                    {reg.event.title}
                                </TableCell>
                                <TableCell>{reg.registrant.fullName}</TableCell>
                                <TableCell>{reg.registrant.email}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        reg.registrant.gender === 'Female' 
                                            ? 'bg-pink-50 text-pink-700' 
                                            : reg.registrant.gender === 'Male'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {reg.registrant.gender || '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col max-w-[200px]">
                                        <span className="text-sm font-medium truncate" title={reg.registrant.interestedMajor || ""}>
                                            {reg.registrant.interestedMajor || "Undecided"}
                                        </span>
                                        {reg.registrant.majorCategory && (
                                            <span className="text-xs text-slate-500 mt-0.5">
                                                {reg.registrant.majorCategory}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {reg.registrant.utmSource ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs bg-slate-100 px-2 py-0.5 rounded w-fit mb-1">{reg.registrant.utmSource}</span>
                                            {reg.registrant.utmMedium && <span className="text-xs text-muted-foreground">{reg.registrant.utmMedium}</span>}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">
                                        {reg.registrant.utmCampaign || "-"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(reg.createdAt), "PP")}
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {reg.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {reg.checkIn ? (
                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                            Checked In
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">
                                            -
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

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
