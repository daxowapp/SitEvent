import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const events = await prisma.event.findMany({
            where: {
                status: "PUBLISHED",
                startDateTime: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
            orderBy: { startDateTime: "asc" },
            select: {
                id: true,
                title: true,
                startDateTime: true,
            },
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error("Events API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}
