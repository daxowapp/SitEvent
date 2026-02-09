"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface Registrant {
    fullName: string;
    email: string;
    phone: string;
    country: string | null;
    city: string | null;
    levelOfStudy: string | null;
    interestedMajor: string | null;
}

interface StudentData {
    id: string;
    registrant: Registrant;
}

interface StudentDataTableProps {
    data: StudentData[];
    fileName: string;
}

export function StudentDataTable({ data, fileName }: StudentDataTableProps) {
    const t = useTranslations('university.studentTable');
    const [search, setSearch] = useState("");

    const filteredData = data.filter(item => {
        const term = search.toLowerCase();
        const r = item.registrant;
        return r.fullName.toLowerCase().includes(term) ||
            r.email.toLowerCase().includes(term) ||
            (r.interestedMajor && r.interestedMajor.toLowerCase().includes(term));
    });

    const downloadCSV = () => {
        const csvContent = [
            [
                t('headers.fullName'),
                t('headers.email'),
                t('headers.phone'),
                t('headers.country'),
                t('headers.city'),
                t('headers.studyLevel'),
                t('headers.interestedMajor')
            ],
            ...filteredData.map(item => [
                item.registrant.fullName,
                item.registrant.email,
                item.registrant.phone,
                item.registrant.country,
                item.registrant.city,
                item.registrant.levelOfStudy,
                item.registrant.interestedMajor
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('searchPlaceholder')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={downloadCSV}>
                    <Download className="mr-2 h-4 w-4" /> {t('downloadCsv')}
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>{t('headers.name')}</TableHead>
                            <TableHead>{t('headers.email')}</TableHead>
                            <TableHead>{t('headers.details')}</TableHead>
                            <TableHead>{t('headers.location')}</TableHead>
                            <TableHead>{t('headers.interest')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    {t('noStudentsFound')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map(({ registrant, id }) => (
                                <TableRow key={id}>
                                    <TableCell className="font-medium">{registrant.fullName}</TableCell>
                                    <TableCell>{registrant.email}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div>{registrant.phone}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div>{registrant.city}</div>
                                            <div className="text-gray-500 text-xs">{registrant.country}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div className="font-medium">{registrant.interestedMajor}</div>
                                            <div className="text-xs text-gray-500">{registrant.levelOfStudy}</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-gray-400 text-center">
                {t('showingStudents', { count: filteredData.length, total: data.length })}
            </div>
        </div>
    );
}
