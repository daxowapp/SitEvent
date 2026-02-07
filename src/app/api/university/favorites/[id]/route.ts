import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/university/favorites/[id] - Update a favorite (note/rating)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const { id } = await params;
    
    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Verify ownership
        const existing = await prisma.favoriteStudent.findUnique({
            where: { id }
        });

        if (!existing || existing.universityId !== session.user.universityId) {
            return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
        }

        const body = await request.json();
        const { note, rating } = body;

        const favorite = await prisma.favoriteStudent.update({
            where: { id },
            data: {
                note: note !== undefined ? note : existing.note,
                rating: rating !== undefined ? rating : existing.rating
            },
            include: {
                registration: {
                    include: {
                        registrant: true
                    }
                }
            }
        });

        return NextResponse.json({ favorite });
    } catch (error) {
        console.error("Error updating favorite:", error);
        return NextResponse.json({ error: "Failed to update favorite" }, { status: 500 });
    }
}

// DELETE /api/university/favorites/[id] - Remove a favorite
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const { id } = await params;
    
    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Verify ownership
        const existing = await prisma.favoriteStudent.findUnique({
            where: { id }
        });

        if (!existing || existing.universityId !== session.user.universityId) {
            return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
        }

        await prisma.favoriteStudent.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting favorite:", error);
        return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 });
    }
}
