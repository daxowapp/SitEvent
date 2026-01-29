import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AdminRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
    // Block in production
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    // Require SUPER_ADMIN authentication
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userType = (session.user as any).type;
    const userRole = session.user.role as AdminRole;
    if (userType !== "ADMIN" || userRole !== AdminRole.SUPER_ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const dbUrl = process.env.DATABASE_URL;
        const totalEvents = await prisma.event.count();
        const publishedEvents = await prisma.event.count({
            where: { status: "PUBLISHED" }
        });
        const upcomingEvents = await prisma.event.count({
            where: {
                status: "PUBLISHED",
                startDateTime: { gte: new Date() }
            }
        });

        return NextResponse.json({
            status: "online",
            databaseUrlConfigured: !!dbUrl,
            counts: {
                total: totalEvents,
                published: publishedEvents,
                upcoming: upcomingEvents
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: error.message,
            // Don't expose stack trace
            env: {
                databaseUrlConfigured: !!process.env.DATABASE_URL
            }
        }, { status: 500 });
    }
}

