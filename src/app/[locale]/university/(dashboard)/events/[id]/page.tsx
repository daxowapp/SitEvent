import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { StudentDataTable } from "./student-table";
import { RegisterEventButton } from "@/components/university/register-event-button";
import { EventProgramTimeline } from "@/components/university/event-program-timeline";
import { EventDetailClient } from "@/components/university/event-detail-client";

interface Attraction {
    name: string;
    description: string;
    imageUrl?: string;
    mapUrl?: string;
    type?: string; 
}

interface Cafe {
    name: string;
    cuisine: string;
    priceRange: string;
    address: string;
    mapUrl?: string;
    type?: string; 
}

interface Transportation {
    airport?: string;
    metro?: string;
    taxi?: string;
    tips?: string;
}

interface EventSession {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
}

export default async function UniversityEventPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            universities: {
                where: { universityId: session.user.universityId }
            },
            cityRef: {
                include: {
                    country: true
                }
            },
            sessions: {
                orderBy: {
                    startTime: 'asc'
                }
            }
        }
    });

    if (!event) return <div>Event not found</div>;

    const participation = event.universities[0];
    const status = participation?.status;
    const isAccepted = status === "ACCEPTED" || status === "INVITED";
    const isPending = status === "REQUESTED";

    // Fetch Registrants (only if accepted)
    const registrations = isAccepted ? await prisma.registration.findMany({
        where: { eventId: id },
        include: {
            registrant: true
        },
        orderBy: { createdAt: 'desc' }
    }) : [];

    // Process City Data
    const attractions = (event.cityRef?.attractions as unknown as Attraction[]) || [];
    const cafes = (event.cityRef?.cafesAndFood as unknown as Cafe[]) || [];
    const transportation = (event.cityRef?.transportation as unknown as Transportation) || {};

    // Helper to get location string
    const locationString = event.cityRef 
        ? `${event.cityRef.name}, ${event.cityRef.country.name}`
        : `${event.city || ""}, ${event.country || ""}`;

    return (
        <EventDetailClient
            event={{
                id: event.id,
                title: event.title,
                slug: event.slug,
                description: event.description || "",
                startDateTime: event.startDateTime,
                endDateTime: event.endDateTime,
                venueName: event.venueName || "",
                venueAddress: event.venueAddress || "",
                city: event.city || "",
                country: event.country || "",
                currency: event.currency || "USD",
                timezone: event.timezone || "UTC",
                sessions: event.sessions.map((s: EventSession) => ({
                    id: s.id,
                    title: s.title,
                    description: s.description,
                    startTime: s.startTime,
                    endTime: s.endTime
                }))
            }}
            locationString={locationString}
            isAccepted={isAccepted}
            isPending={isPending}
            participation={participation ? { boothNumber: participation.boothNumber } : undefined}
            registrationsCount={registrations.length}
            attractions={attractions}
            cafes={cafes}
            transportation={transportation}
            hasCityRef={!!event.cityRef}
            studentTableComponent={
                isAccepted ? (
                    <StudentDataTable data={registrations} fileName={`students-${event.slug}`} />
                ) : null
            }
            registerButtonComponent={
                !participation ? (
                    <RegisterEventButton 
                        eventId={event.id} 
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-200 h-12 rounded-xl" 
                        text="Register Now" 
                    />
                ) : null
            }
            programComponent={
                isAccepted ? (
                    <EventProgramTimeline 
                        sessions={event.sessions} 
                        timezone={event.timezone || "UTC"} 
                    />
                ) : null
            }
        />
    );
}
