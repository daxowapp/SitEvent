import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/university/students/search - Search students by name/email/phone
export async function GET(request: NextRequest) {
    const session = await auth();
    
    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const query = searchParams.get("q");
    const global = searchParams.get("global") === "true";

    if (!query || query.length < 2) {
        return NextResponse.json({ students: [] });
    }

    try {
        // For global search, first get all events where university participates
        let eventIds: string[] = [];
        
        if (global) {
            const participations = await prisma.eventParticipating.findMany({
                where: {
                    universityId: session.user.universityId,
                    status: { in: ["ACCEPTED", "INVITED"] }
                },
                select: { eventId: true }
            });
            eventIds = participations.map(p => p.eventId);
            
            if (eventIds.length === 0) {
                return NextResponse.json({ students: [] });
            }
        }

        // Search registrations
        const registrations = await prisma.registration.findMany({
            where: {
                eventId: global ? { in: eventIds } : eventId!,
                OR: [
                    { registrant: { fullName: { contains: query, mode: 'insensitive' } } },
                    { registrant: { email: { contains: query, mode: 'insensitive' } } },
                    { registrant: { phone: { contains: query, mode: 'insensitive' } } }
                ]
            },
            include: {
                registrant: true,
                checkIn: true,
                event: {
                    select: { id: true, title: true, slug: true }
                },
                favorites: {
                    where: { universityId: session.user.universityId }
                }
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });

        // Use type assertion to work around stale Prisma types in IDE
        const students = (registrations as any[]).map(reg => ({
            id: reg.id,
            registrantId: reg.registrantId,
            fullName: reg.registrant.fullName,
            email: reg.registrant.email,
            phone: reg.registrant.phone,
            country: reg.registrant.country,
            city: reg.registrant.city,
            interestedMajor: reg.registrant.interestedMajor,
            majorCategory: reg.registrant.majorCategory,
            levelOfStudy: reg.registrant.levelOfStudy,
            checkedIn: !!reg.checkIn,
            eventId: reg.event.id,
            eventTitle: reg.event.title,
            eventSlug: reg.event.slug,
            isFavorite: reg.favorites.length > 0,
            favoriteId: reg.favorites[0]?.id || null,
            favoriteNote: reg.favorites[0]?.note || null,
            favoriteRating: reg.favorites[0]?.rating || 0
        }));

        return NextResponse.json({ students });
    } catch (error) {
        console.error("Error searching students:", error);
        return NextResponse.json({ error: "Failed to search students", details: String(error) }, { status: 500 });
    }
}
