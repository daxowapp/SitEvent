"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Download, Search, Sparkles, BookOpen, Mail, Phone, Filter } from "lucide-react";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

interface GlobalLeadsTableProps {
    data: any[];
}

export function GlobalLeadsTable({ data }: GlobalLeadsTableProps) {
    const t = useTranslations('university.leads');
    const [search, setSearch] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("all");
    const [selectedMajor, setSelectedMajor] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page when filters change
    const [prevFilters, setPrevFilters] = useState({ search, selectedEvent, selectedMajor });
    if (prevFilters.search !== search || prevFilters.selectedEvent !== selectedEvent || prevFilters.selectedMajor !== selectedMajor) {
        setPrevFilters({ search, selectedEvent, selectedMajor });
        setCurrentPage(1);
    }

    // Extract unique values
    const uniqueEvents = Array.from(new Set(data.map(item => item.event.title))).sort();
    // Use majorCategory (AI-categorized) for the filter
    const uniqueCategories = Array.from(new Set(data.map(item => item.registrant.majorCategory).filter((m): m is string => Boolean(m) && m !== "Uncategorized"))).sort();

    // Derived state for filtering
    const filteredData = data.filter(item => {
        const term = search.toLowerCase();
        const r = item.registrant;
        const eventTitle = item.event.title;
        const category = r.majorCategory;

        const matchesSearch = r.fullName.toLowerCase().includes(term) ||
            r.email.toLowerCase().includes(term) ||
            (r.interestedMajor && r.interestedMajor.toLowerCase().includes(term)) ||
            (r.majorCategory && r.majorCategory.toLowerCase().includes(term));

        const matchesEvent = selectedEvent === "all" || eventTitle === selectedEvent;
        const matchesMajor = selectedMajor === "all" || category === selectedMajor;

        return matchesSearch && matchesEvent && matchesMajor;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getGenderColor = (gender: string | null) => {
        if (gender === 'Female') return 'text-pink-600 bg-pink-50 border-pink-100';
        if (gender === 'Male') return 'text-blue-600 bg-blue-50 border-blue-100';
        return 'text-gray-600 bg-gray-50 border-gray-100';
    };

    const downloadCSV = () => {
        const csvContent = [
            [t('table.sourceEvent'), t('table.status'), t('table.student'), 'Gender', t('table.contact'), 'Phone', 'Country', 'City', 'Major (Std)', t('table.interest'), 'Category', 'Level'],
            ...filteredData.map(item => [
                `"${item.event.title}"`,
                format(new Date(item.createdAt), "yyyy-MM-dd"),
                item.status,
                `"${item.registrant.fullName}"`,
                item.registrant.gender || '',
                item.registrant.email,
                item.registrant.phone,
                item.registrant.country,
                item.registrant.city,
                `"${item.registrant.standardizedMajor || ''}"`,
                `"${item.registrant.interestedMajor || ''}"`,
                `"${item.registrant.majorCategory || ''}"`,
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
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            className="pl-9 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                        <SelectTrigger className="w-[200px] bg-white">
                            <SelectValue placeholder={t('allEvents')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allEvents')}</SelectItem>
                            {uniqueEvents.map((e: unknown) => (
                                <SelectItem key={String(e)} value={String(e)}>{String(e)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                        <SelectTrigger className="w-[200px] bg-white">
                            <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            <SelectValue placeholder={t('allCategories')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allCategories')}</SelectItem>
                            {uniqueCategories.map((m: unknown) => (
                                <SelectItem key={String(m)} value={String(m)}>{String(m)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" onClick={downloadCSV} className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                    <Download className="mr-2 h-4 w-4" /> {t('exportCsv')}
                </Button>
            </div>

            {/* Premium Table Card */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 bg-white/50 backdrop-blur-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200">
                            <TableHead className="py-4 pl-6 font-semibold text-gray-600 w-[300px]">{t('table.student')}</TableHead>
                            <TableHead className="py-4 font-semibold text-gray-600 w-[250px]">{t('table.interest')}</TableHead>
                            <TableHead className="py-4 font-semibold text-gray-600 w-[200px]">{t('table.contact')}</TableHead>
                            <TableHead className="py-4 font-semibold text-gray-600 w-[180px]">{t('table.sourceEvent')}</TableHead>
                            <TableHead className="py-4 font-semibold text-gray-600 w-[100px]">{t('table.status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-16">
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <Search className="h-10 w-10 text-gray-300 mb-2" />
                                        <p className="text-lg font-medium">{t('noLeads')}</p>
                                        <p className="text-sm">{t('tryAdjusting')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map(({ registrant, event, id, createdAt }) => (
                                <TableRow key={id} className="group hover:bg-blue-50/30 transition-colors border-gray-100">
                                    <TableCell className="py-4 pl-6 align-top">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-10 w-10 border border-gray-100 shadow-sm mt-1">
                                                <AvatarFallback className={`${getGenderColor(registrant.gender).replace('border-', '')} text-xs font-bold`}>
                                                    {getInitials(registrant.fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate block max-w-[200px]" title={registrant.fullName}>
                                                    {registrant.fullName}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                                        {registrant.nationality || t('international')}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="whitespace-nowrap">{registrant.levelOfStudy}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    
                                    <TableCell className="py-4 align-top">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="font-medium text-gray-900 break-words max-w-[220px]">
                                                {registrant.interestedMajor || <span className="text-gray-400 italic">{t('undecided')}</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {registrant.majorCategory && registrant.majorCategory !== 'Uncategorized' && (
                                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100/50 font-normal text-[10px] px-2 h-5 whitespace-nowrap">
                                                        <BookOpen className="w-3 h-3 mr-1" />
                                                        {registrant.majorCategory}
                                                    </Badge>
                                                )}
                                                {registrant.standardizedMajor && registrant.standardizedMajor !== registrant.interestedMajor && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge variant="outline" className="text-gray-500 border-gray-200 font-normal text-[10px] px-2 h-5 gap-1 cursor-help whitespace-nowrap">
                                                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                                                    AI
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('standardizedFrom', { major: registrant.interestedMajor })}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    
                                    <TableCell className="py-4 align-top">
                                        <div className="flex flex-col gap-1 text-sm">
                                            <a href={`mailto:${registrant.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group/link">
                                                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span className="truncate max-w-[170px]" title={registrant.email}>{registrant.email}</span>
                                            </a>
                                            <a href={`tel:${registrant.phone}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap">
                                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>{registrant.phone}</span>
                                            </a>
                                        </div>
                                    </TableCell>
                                    
                                    <TableCell className="py-4 align-top">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 truncate max-w-[160px]" title={event.title}>{event.title}</span>
                                            <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                                                {format(new Date(createdAt), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                    </TableCell>
                                    
                                    <TableCell className="py-4 align-top">
                                        <Badge 
                                            variant="outline" 
                                            className={`${getGenderColor(registrant.gender)} font-medium border px-2.5 py-0.5 rounded-full whitespace-nowrap`}
                                        >
                                            {registrant.gender || t('unknown')}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
            
            {/* Pagination Controls */}
            {filteredData.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 px-2 font-medium">
                    <div className="flex items-center gap-4">
                        <span>{t('showing', { start: startIndex + 1, end: Math.min(startIndex + itemsPerPage, filteredData.length), total: filteredData.length })}</span>
                        <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                        <span>{t('totalDatabase', { count: data.length })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-24"
                        >
                            {t('previous')}
                        </Button>
                        <span className="min-w-[80px] text-center">
                            {t('pageInfo', { current: currentPage, total: Math.max(1, totalPages) })}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 w-24"
                        >
                            {t('next')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
