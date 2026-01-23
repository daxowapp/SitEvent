import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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
            stack: error.stack,
            env: {
                databaseUrlConfigured: !!process.env.DATABASE_URL
            }
        }, { status: 500 });
    }
}
