import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppConfirmation } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
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
        console.error("Test Endpoint Error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
