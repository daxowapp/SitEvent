import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppConfirmation } from "@/lib/whatsapp";
import { auth } from "@/lib/auth";
import { AdminRole } from "@prisma/client";

export async function POST(request: NextRequest) {
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
        const body = await request.json();
        const { phone } = body;

        if (!phone) {
            return NextResponse.json(
                { success: false, message: "Phone number is required (e.g. +201xxxxxxxxx)" },
                { status: 400 }
            );
        }

        // Send a test message
        const result = await sendWhatsAppConfirmation({
            to: phone,
            studentName: "Test User",
            eventTitle: "Sit Connect Test Event",
            eventDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            qrToken: "test-token-123", // Dummy token
            templateName: "event_registration_confirm" // Explicitly use the new name
        });

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}

