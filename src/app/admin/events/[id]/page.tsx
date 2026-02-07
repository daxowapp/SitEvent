import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "../event-form";
import { DeleteEventButton } from "./delete-button";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { EventUniversityManager } from "@/components/admin/events/event-university-manager";
import { requireManagerOrAbove } from "@/lib/role-check";

// Get countries for the form dropdown
async function getCountries() {
    try {
        return await prisma.country.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                code: true,
                flagEmoji: true,
                timezone: true,
            }
        });
    } catch {
        return [];
    }
}

async function getEvent(id: string) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[project-ref]')) {
        return null;
    }

    try {
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                universities: {
                    include: {
                        university: true
                    }
                },
                sessions: {
                    orderBy: {
                        startTime: 'asc'
                    }
                }
            }
        });
        return event;
    } catch {
        return null;
    }
}

async function updateEvent(id: string, data: any) {
    "use server";

    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Convert wall-clock time back to UTC based on event timezone
    const timezone = data.timezone || "UTC";
    const startDateTime = fromZonedTime(data.startDateTime, timezone);
    const endDateTime = fromZonedTime(data.endDateTime, timezone);
    const registrationOpenAt = data.registrationOpenAt
        ? fromZonedTime(data.registrationOpenAt, timezone)
        : null;
    const registrationCloseAt = data.registrationCloseAt
        ? fromZonedTime(data.registrationCloseAt, timezone)
        : null;

    await prisma.event.update({
        where: { id },
        data: {
            title: data.title,
            slug: data.slug,
            country: data.country,
            city: data.city,
            venueName: data.venueName,
            venueAddress: data.venueAddress,
            mapUrl: data.mapUrl || null,
            startDateTime,
            endDateTime,
            timezone,
            bannerImageUrl: data.bannerImageUrl || null,
            galleryImages: data.galleryImages || [],
            description: data.description || null,
            // Multi-language translations
            titleTranslations: data.titleTranslations || null,
            descriptionTranslations: data.descriptionTranslations || null,
            // University Pricing
            participationFee: data.participationFee || null,
            currency: data.currency || "USD",
            registrationOpenAt,
            registrationCloseAt,
            capacity: data.capacity || null,
            status: data.status,
            // Marketing
            gaTrackingId: data.gaTrackingId || null,
            fbPixelId: data.fbPixelId || null,
            linkedInPartnerId: data.linkedInPartnerId || null,
            tiktokPixelId: data.tiktokPixelId || null,
            snapPixelId: data.snapPixelId || null,
            customHeadScript: data.customHeadScript || null,
            customBodyScript: data.customBodyScript || null,
            // Zoho
            zohoCampaignId: data.zohoCampaignId || null,
            zohoLeadSource: data.zohoLeadSource || null,
        },
    });

    redirect("/admin/events");
}

async function deleteEvent(id: string) {
    "use server";

    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Delete related records first (cascade)
    await prisma.$transaction([
        // Delete messages for registrations of this event
        prisma.messageLog.deleteMany({
            where: {
                registration: {
                    eventId: id
                }
            }
        }),
        // Delete check-ins for registrations of this event
        prisma.checkIn.deleteMany({
            where: {
                registration: {
                    eventId: id
                }
            }
        }),
        // Delete registrations for this event
        prisma.registration.deleteMany({
            where: { eventId: id }
        }),
        // Delete the event itself
        prisma.event.delete({
            where: { id }
        })
    ]);

    redirect("/admin/events");
}

async function getAllUniversities() {
    return prisma.university.findMany({
        where: { isActive: true },
        select: { id: true, name: true, city: true, country: true },
        orderBy: { name: 'asc' }
    });
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventSessionsList } from "@/components/admin/events/sessions/session-list";

import { DuplicateEventButton } from "../duplicate-event-button";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    await requireManagerOrAbove();
    const { id } = await params;
    const [event, countries, allUniversities] = await Promise.all([
        getEvent(id),
        getCountries(),
        getAllUniversities()
    ]);

    if (!event) {
        notFound();
    }

    // Format times in the EVENT'S timezone for the form inputs
    const tz = event.timezone || "UTC";

    // We use strict format for datetime-local: YYYY-MM-DDThh:mm
    const initialData = {
        ...event,
        startDateTime: formatInTimeZone(event.startDateTime, tz, "yyyy-MM-dd'T'HH:mm"),
        endDateTime: formatInTimeZone(event.endDateTime, tz, "yyyy-MM-dd'T'HH:mm"),
        registrationOpenAt: event.registrationOpenAt
            ? formatInTimeZone(event.registrationOpenAt, tz, "yyyy-MM-dd'T'HH:mm")
            : undefined,
        registrationCloseAt: event.registrationCloseAt
            ? formatInTimeZone(event.registrationCloseAt, tz, "yyyy-MM-dd'T'HH:mm")
            : undefined,
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Edit Event</h1>
                    <p className="text-muted-foreground">
                        Update event details and settings
                    </p>
                </div>
                <DuplicateEventButton eventId={id} />
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="program">Program</TabsTrigger>
                    <TabsTrigger value="universities">Universities</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EventForm
                                initialData={initialData as any}
                                onSubmit={updateEvent.bind(null, id)}
                                countries={countries}
                                eventId={id}
                            />
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Delete this event</p>
                                    <p className="text-sm text-muted-foreground">
                                        Once deleted, this event and all its data cannot be recovered.
                                    </p>
                                </div>
                                <DeleteEventButton
                                    eventId={id}
                                    eventTitle={event.title}
                                    onDelete={deleteEvent.bind(null, id)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="program">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Program</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EventSessionsList 
                                eventId={id} 
                                sessions={(event as any).sessions || []} 
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="universities">
                     <EventUniversityManager
                        eventId={id}
                        participatingUniversities={event.universities as any}
                        allUniversities={allUniversities}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
