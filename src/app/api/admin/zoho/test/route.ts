import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createZohoLead } from "@/lib/zoho";

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Send a test lead to Zoho
        const result = await createZohoLead({
            fullName: "Test Lead (Events App)",
            email: `test-${Date.now()}@events-app-test.com`,
            phone: "+1234567890",
            country: "Test Country",
            city: "Test City",
            leadSource: "Test - Events App Admin",
            eventTitle: "Admin Panel Test",
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Test lead created successfully",
                leadId: result.leadId,
            });
        }

        return NextResponse.json({
            success: false,
            message: "Failed to create test lead",
            error: result.error,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Test failed",
            error: error.message,
        }, { status: 500 });
    }
}
