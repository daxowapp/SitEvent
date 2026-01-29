import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, UserCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { RegistrationsTable } from "./registrations-table";
import { requireManagerOrAbove } from "@/lib/role-check";

export const metadata = {
    title: "Registrations",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        eventId?: string;
        status?: string;
        source?: string;
    }>;
}

export default async function RegistrationsPage({ searchParams }: PageProps) {
    await requireManagerOrAbove();
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = params.q || "";
    const eventId = params.eventId;
    const status = params.status;
    const source = params.source;

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
    if (source) {
        // If we already have a registrant filter (from query), merge it
        if (!where.registrant) where.registrant = {};
        where.registrant.utmSource = source;
    }

    // Parallel data fetching
    const [registrations, totalCount, events, stats, sourceStats, uniqueSources] = await Promise.all([
        prisma.registration.findMany({
            where,
            include: {
                registrant: true,
                event: { select: { title: true } },
                checkIn: true,
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
        prisma.registration.aggregate({
            _count: { _all: true },
        }),
        // Aggregate top sources for stats card
        prisma.registrant.groupBy({
            by: ['utmSource'],
            _count: {
                utmSource: true,
            },
            orderBy: {
                _count: {
                    utmSource: 'desc',
                }
            },
            take: 5,
            where: {
                utmSource: { not: null },
            }
        }),
        // Fetch distinct sources for filter dropdown
        prisma.registrant.findMany({
            where: {
                utmSource: { not: null }
            },
            select: {
                utmSource: true
            },
            distinct: ['utmSource'],
            orderBy: {
                utmSource: 'asc'
            }
        })
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

            <div className="grid gap-4 md:grid-cols-4">
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
                        <CardTitle className="text-sm font-medium">Top Sources</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-1">
                            {sourceStats.length > 0 ? (
                                sourceStats.map((s) => (
                                    <div key={s.utmSource} className="flex justify-between">
                                        <span className="font-medium truncate max-w-[80px]" title={s.utmSource || ""}>
                                            {s.utmSource}
                                        </span>
                                        <span className="text-muted-foreground">{s._count.utmSource}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">No tracked sources yet</p>
                            )}
                        </div>
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
                        sources={uniqueSources.map(s => s.utmSource).filter(Boolean) as string[]}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
