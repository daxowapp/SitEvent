import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { DuplicateEventButton } from "@/components/admin/DuplicateEventButton";
import { CopyKioskLinkButton } from "@/components/admin/copy-kiosk-link-button";
import { CopyScannerLinkButton } from "@/components/admin/copy-scanner-link-button";
import { requireManagerOrAbove } from "@/lib/role-check";

export const metadata = {
    title: "Events",
};

import { prisma } from "@/lib/db";

async function getEvents() {
    return prisma.event.findMany({
        orderBy: { startDateTime: "desc" },
        include: {
            _count: {
                select: { registrations: true, universities: true }
            }
        }
    });
}

export default async function AdminEventsPage() {
    await requireManagerOrAbove();
    const events = await getEvents();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Events</h1>
                    <p className="text-muted-foreground">Manage your recruitment events</p>
                </div>
                <Button asChild>
                    <Link href="/admin/events/new">+ Create Event</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Events ({events.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event Title</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Registrations</TableHead>
                                <TableHead>Universities</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event: any) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.title}</TableCell>
                                    <TableCell>
                                        {event.city}, {event.country}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(event.startDateTime), "PP")}
                                    </TableCell>
                                    <TableCell>
                                        {event._count?.registrations || 0}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{event._count?.universities || 0}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                event.status === "PUBLISHED"
                                                    ? "default"
                                                    : event.status === "DRAFT"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {event.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/events/${event.id}`}>Edit</Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/events/${event.slug}`} target="_blank">
                                                    Visit
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/events/${event.id}/analytics`}>Analytics</Link>
                                            </Button>
                                            <CopyKioskLinkButton 
                                                slug={event.slug} 
                                                city={event.city} 
                                                country={event.country} 
                                            />
                                            <CopyScannerLinkButton eventId={event.id} />
                                            <DuplicateEventButton eventId={event.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
