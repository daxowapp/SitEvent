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

    // RBAC: Only ADMINs can access this page
    if (session.user.role !== "ADMIN") {
        redirect("/university/dashboard");
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
    // Strict Access Control: 
    // - ADMINs see all students who visited this university's booth at this event
    // - MEMBERs only see students they personally scanned at this event
    let registrations: any[] = [];
    if (isAccepted) {
        const whereClause: any = {
            eventId: id,
            universityId: session.user.universityId
        };

        if (session.user.role !== "ADMIN") {
            whereClause.scannedById = session.user.id;
        }

        const boothVisits = await prisma.boothVisit.findMany({
            where: whereClause,
            include: {
                registration: {
                    include: {
                        registrant: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map it back to the expected array shape (Array of mapped objects mimicking Registration)
        registrations = boothVisits.map(visit => ({
            id: visit.id,
            registrant: visit.registration.registrant
        }));
    }

    // Process City Data
    const attractions = (event.cityRef?.attractions as unknown as Attraction[]) || [];
    const cafes = (event.cityRef?.cafesAndFood as unknown as Cafe[]) || [];
    const transportation = (event.cityRef?.transportation as unknown as Transportation) || {};

    // Helper to get location string
    const locationString = event.cityRef 
        ? `${event.cityRef.name}, ${event.cityRef.country.name}`
        : `${event.city || ""}, ${event.country || ""}`;

    // Check for linked B2B event
    let b2bLiveToken: string | null = null;
    const b2bEvent = await prisma.b2BEvent.findUnique({
        where: { eventId: id },
        select: { id: true },
    });
    if (b2bEvent) {
        const b2bParticipant = await prisma.b2BParticipant.findFirst({
            where: {
                b2bEventId: b2bEvent.id,
                universityId: session.user.universityId,
                side: "A",
            },
            select: { scheduleToken: true },
        });
        if (b2bParticipant?.scheduleToken) {
            b2bLiveToken = b2bParticipant.scheduleToken;
        }
    }

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
            b2bLiveToken={b2bLiveToken}
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
