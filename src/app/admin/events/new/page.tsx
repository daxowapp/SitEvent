import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "../event-form";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Get countries for the form dropdown
async function getCountries() {
    return prisma.country.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            code: true,
            flagEmoji: true,
            timezone: true,
        }
    });
}

async function createEvent(data: {
    title: string;
    slug: string;
    cityId?: string;
    country: string;
    city: string;
    venueName: string;
    venueAddress: string;
    mapUrl?: string;
    startDateTime: string;
    endDateTime: string;
    timezone: string;
    bannerImageUrl?: string;
    galleryImages: string[];
    description?: string;
    // Multi-language translations
    titleTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
    // University Pricing
    participationFee?: number;
    currency?: string;
    registrationOpenAt?: string;
    registrationCloseAt?: string;
    capacity?: number;
    status: "DRAFT" | "PUBLISHED" | "FINISHED";
    // Marketing
    gaTrackingId?: string;
    fbPixelId?: string;
    linkedInPartnerId?: string;
    tiktokPixelId?: string;
    snapPixelId?: string;
    customHeadScript?: string;
    customBodyScript?: string;
    // Zoho
    zohoCampaignId?: string;
    zohoLeadSource?: string;
}) {
    "use server";

    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Check slug uniqueness
    const existingEvent = await prisma.event.findUnique({
        where: { slug: data.slug },
    });

    if (existingEvent) {
        throw new Error("An event with this slug already exists");
    }

    const event = await prisma.event.create({
        data: {
            title: data.title,
            slug: data.slug,
            cityId: data.cityId || null,
            country: data.country,
            city: data.city,
            venueName: data.venueName,
            venueAddress: data.venueAddress,
            mapUrl: data.mapUrl || null,
            startDateTime: new Date(data.startDateTime),
            endDateTime: new Date(data.endDateTime),
            timezone: data.timezone,
            bannerImageUrl: data.bannerImageUrl || null,
            galleryImages: data.galleryImages || [],
            description: data.description || null,
            // Multi-language translations
            titleTranslations: data.titleTranslations || null,
            descriptionTranslations: data.descriptionTranslations || null,
            // University Pricing
            participationFee: data.participationFee || null,
            currency: data.currency || "USD",
            registrationOpenAt: data.registrationOpenAt ? new Date(data.registrationOpenAt) : null,
            registrationCloseAt: data.registrationCloseAt ? new Date(data.registrationCloseAt) : null,
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
            createdById: session.user.id,
        },
    });

    redirect(`/admin/events/${event.id}`);
}

export default async function NewEventPage() {
    const countries = await getCountries();

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Create New Event</h1>
                <p className="text-muted-foreground">
                    Fill in the details to create a new education event
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <EventForm onSubmit={createEvent} countries={countries} />
                </CardContent>
            </Card>
        </div>
    );
}

