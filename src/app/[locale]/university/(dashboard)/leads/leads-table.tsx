"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface GlobalLeadsTableProps {
    data: any[];
}

export function GlobalLeadsTable({ data }: GlobalLeadsTableProps) {
    const [search, setSearch] = useState("");

    // Derived state for filtering
    const filteredData = data.filter(item => {
        const term = search.toLowerCase();
        const r = item.registrant;
        const eventTitle = item.event.title.toLowerCase();

        return r.fullName.toLowerCase().includes(term) ||
            r.email.toLowerCase().includes(term) ||
            eventTitle.includes(term) ||
            (r.interestedMajor && r.interestedMajor.toLowerCase().includes(term));
    });

    const downloadCSV = () => {
        const csvContent = [
            ["Event", "Date", "Ticket Status", "Full Name", "Email", "Phone", "Country", "City", "Major", "Level"],
            ...filteredData.map(item => [
                `"${item.event.title}"`,
                format(new Date(item.createdAt), "yyyy-MM-dd"), // Registration date
                item.status,
                `"${item.registrant.fullName}"`,
                item.registrant.email,
                item.registrant.phone,
                item.registrant.country,
                item.registrant.city,
                `"${item.registrant.interestedMajor || ''}"`,
                item.registrant.levelOfStudy || ''
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `university-leads-${format(new Date(), "yyyy-MM-dd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search leads..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={downloadCSV} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Student Details</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Event Context</TableHead>
                            <TableHead>Interest</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                    No leads found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map(({ registrant, event, id, createdAt }) => (
                                <TableRow key={id} className="hover:bg-gray-50/50">
                                    <TableCell>
                                        <div className="font-medium text-gray-900">{registrant.fullName}</div>
                                        <div className="text-xs text-gray-500">{registrant.nationality || "International"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-700">{registrant.email}</div>
                                        <div className="text-xs text-gray-500">{registrant.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-red-700">{event.title}</div>
                                        <div className="text-xs text-gray-500">
                                            Reg: {format(new Date(createdAt), "MMM d, yyyy")}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{registrant.interestedMajor || "Undecided"}</div>
                                        <div className="text-xs text-gray-500">{registrant.levelOfStudy}</div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                <span>Showing {filteredData.length} leads</span>
                <span>Total Database: {data.length}</span>
            </div>
        </div>
    );
}
