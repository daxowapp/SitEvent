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

export const metadata = {
    title: "Events",
};

async function getEvents() {
    if (!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[project-ref]'))) {
        return [
            { id: "1", title: "Istanbul Fair", slug: "istanbul-fair", country: "Turkey", city: "Istanbul", status: "PUBLISHED", startDateTime: new Date() },
        ];
    }

    try {
        const { prisma } = await import("@/lib/db");
        return await prisma.event.findMany({
            orderBy: { startDateTime: "desc" },
            include: {
                _count: {
                    select: { registrations: true }
                }
            }
        });
    } catch {
        return [
            { id: "1", title: "Istanbul Fair", slug: "istanbul-fair", country: "Turkey", city: "Istanbul", status: "PUBLISHED", startDateTime: new Date(), _count: { registrations: 0 } },
        ];
    }
}

export default async function AdminEventsPage() {
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
