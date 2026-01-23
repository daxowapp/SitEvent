import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, UserCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { RegistrationsTable } from "./registrations-table";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        eventId?: string;
        status?: string;
    }>;
}

export default async function RegistrationsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = params.q || "";
    const eventId = params.eventId;
    const status = params.status;

    // Filter construction
    const where: any = {};
    if (query) {
        where.registrant = {
            OR: [
                { fullName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
            ],
        };
    }
    if (eventId) {
        where.eventId = eventId;
    }
    if (status) {
        where.status = status;
    }

    // Parallel data fetching
    const [registrations, totalCount, events, stats] = await Promise.all([
        prisma.registration.findMany({
            where,
            include: {
                registrant: true,
                event: { select: { title: true } },
                checkIn: true, // Include check-in info
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip,
        }),
        prisma.registration.count({ where }),
        prisma.event.findMany({
            select: { id: true, title: true },
            orderBy: { startDateTime: "desc" },
        }),
        // Aggregate stats (global, or filtered? Let's do global metrics for cards usually)
        prisma.registration.aggregate({
            _count: { _all: true },
        }),
    ]);

    // Separate check-in count query for accuracy
    const checkInCount = await prisma.registration.count({
        where: {
            checkIn: { isNot: null },
        },
    });

    const pageCount = Math.ceil(totalCount / limit);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Registrations</h1>
                    <p className="text-muted-foreground">Manage and export attendee data</p>
                </div>
                <Button variant="outline" className="gap-2" asChild>
                    <Link href="/api/admin/export">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats._count._all}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{checkInCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {((checkInCount / (stats._count._all || 1)) * 100).toFixed(1)}% Conversion
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Events Active</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{events.length}</div>
                        <p className="text-xs text-muted-foreground">managed events</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance List</CardTitle>
                </CardHeader>
                <CardContent>
                    <RegistrationsTable
                        registrations={registrations}
                        events={events}
                        pageCount={pageCount}
                        currentPage={page}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
