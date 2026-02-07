import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/university/favorites - List favorites for an event
export async function GET(request: NextRequest) {
    const session = await auth();
    
    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
        return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    try {
        const favorites = await prisma.favoriteStudent.findMany({
            where: {
                eventId,
                universityId: session.user.universityId
            },
            include: {
                registration: {
                    include: {
                        registrant: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ favorites });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
    }
}

// POST /api/university/favorites - Add a student to favorites
export async function POST(request: NextRequest) {
    const session = await auth();
    
    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { eventId, registrationId, note, rating } = body;

        if (!eventId || !registrationId) {
            return NextResponse.json({ error: "eventId and registrationId are required" }, { status: 400 });
        }

        // Check if already favorited
        const existing = await prisma.favoriteStudent.findUnique({
            where: {
                eventId_universityId_registrationId: {
                    eventId,
                    universityId: session.user.universityId,
                    registrationId
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Student already in favorites" }, { status: 409 });
        }

        const favorite = await prisma.favoriteStudent.create({
            data: {
                eventId,
                universityId: session.user.universityId,
                registrationId,
                note: note || null,
                rating: rating || 0
            },
            include: {
                registration: {
                    include: {
                        registrant: true
                    }
                }
            }
        });

        return NextResponse.json({ favorite }, { status: 201 });
    } catch (error) {
        console.error("Error adding favorite:", error);
        return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
    }
}
