import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireManagerOrAbove } from "@/lib/role-check";
import { EventMessagingPanel } from "@/components/admin/events/event-messaging-panel";
import { differenceInDays, differenceInHours } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EventMessagingPage({ params }: { params: Promise<{ id: string }> }) {
    await requireManagerOrAbove();
    const { id } = await params;

    const event = await prisma.event.findUnique({
        where: { id },
    });

    if (!event) {
        notFound();
    }

    const now = new Date();
    const eventStart = new Date(event.startDateTime);
    const daysUntil = Math.max(0, differenceInDays(eventStart, now));
    const hoursUntil = Math.max(0, differenceInHours(eventStart, now));
    const isPast = eventStart < now;
    const totalRegistrants = await prisma.registration.count({
        where: { eventId: id, status: "REGISTERED" },
    });

    const tz = event.timezone || "UTC";
    const formattedDate = formatInTimeZone(eventStart, tz, "EEEE, MMMM d, yyyy");
    const formattedTime = `${formatInTimeZone(eventStart, tz, "h:mm a")} - ${formatInTimeZone(new Date(event.endDateTime), tz, "h:mm a")}`;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/events">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Events
                    </Link>
                </Button>
            </div>

            <div>
                <h1 className="text-2xl font-bold">Email & Reminders</h1>
                <p className="text-muted-foreground">
                    {event.title} — {formattedDate}, {formattedTime} ({tz.replace("_", " ")})
                </p>
            </div>

            <EventMessagingPanel
                eventId={id}
                eventTitle={event.title}
                daysUntil={daysUntil}
                hoursUntil={hoursUntil}
                totalRegistrants={totalRegistrants}
                isPast={isPast}
            />
        </div>
    );
}
