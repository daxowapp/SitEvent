import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { prisma } from "@/lib/db";

export const metadata = {
    title: "Events",
};

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

function EventTable({ events, emptyMessage }: { events: any[], emptyMessage: string }) {
    if (events.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
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
                            <div className="flex items-center gap-1.5">
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
                                {event.redPointsEnabled && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                                        🏆 RP
                                    </Badge>
                                )}
                            </div>
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
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/admin/events/${event.id}/messaging`}>Message</Link>
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
    );
}

export default async function AdminEventsPage() {
    await requireManagerOrAbove();
    const events = await getEvents();
    
    const now = new Date();
    // Assuming endDateTime exists, otherwise use startDateTime
    // Let's rely on startDateTime to partition past vs future unless endDateTime is standard
    const newEvents = events.filter((e: any) => new Date(e.startDateTime) >= now || (e.endDateTime && new Date(e.endDateTime) >= now));
    const pastEvents = events.filter((e: any) => new Date(e.startDateTime) < now && (!e.endDateTime || new Date(e.endDateTime) < now));

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

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="upcoming">Upcoming Events ({newEvents.length})</TabsTrigger>
                    <TabsTrigger value="past">Past Events ({pastEvents.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming & Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EventTable events={newEvents} emptyMessage="No upcoming events found." />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="past">
                    <Card>
                        <CardHeader>
                            <CardTitle>Past Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EventTable events={pastEvents} emptyMessage="No past events found." />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
