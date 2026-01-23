import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Building2 } from "lucide-react";
import { format } from "date-fns";
import RequestJoinButton from "./request-join-button";

export default async function ExploreEventsPage() {
    const session = await auth();
    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    const universityId = session.user.universityId;

    // Get IDs of events already participating/requested
    const myParticipations = await prisma.eventParticipating.findMany({
        where: { universityId },
        select: { eventId: true }
    });
    const myEventIds = myParticipations.map(p => p.eventId);

    // Fetch upcoming events NOT in my list
    const availableEvents = await prisma.event.findMany({
        where: {
            status: "PUBLISHED",
            endDateTime: { gte: new Date() },
            id: { notIn: myEventIds }
        },
        orderBy: { startDateTime: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
                <p className="text-muted-foreground mt-2">Discover and join upcoming education fairs.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableEvents.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No new upcoming events found. Check back later!
                    </div>
                ) : (
                    availableEvents.map(event => (
                        <Card key={event.id} className="flex flex-col">
                            <div className="h-32 bg-gray-100 relative">
                                {event.bannerImageUrl ? (
                                    <img
                                        src={event.bannerImageUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover rounded-t-lg"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                )}
                            </div>
                            <CardHeader>
                                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                                <CardDescription className="flex flex-col gap-1 mt-2">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(event.startDateTime), "MMM d, yyyy")}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        {event.city}, {event.country}
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-gray-600 line-clamp-3">
                                    {event.description}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <RequestJoinButton eventId={event.id} />
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
