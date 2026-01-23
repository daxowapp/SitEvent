import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if credentials are configured
        const clientId = process.env.ZOHO_CLIENT_ID;
        const clientSecret = process.env.ZOHO_CLIENT_SECRET;
        const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            return NextResponse.json({
                connected: false,
                message: "Zoho credentials not configured in .env file",
                missing: {
                    clientId: !clientId,
                    clientSecret: !clientSecret,
                    refreshToken: !refreshToken,
                },
            });
        }

        // Try to get an access token to verify credentials
        const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
        const tokenUrl = `${accountsDomain}/oauth/v2/token`;
        const params = new URLSearchParams({
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
        });

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
                connected: false,
                message: "Failed to authenticate with Zoho",
                error: errorText,
            });
        }

        const data = await response.json();

        if (data.access_token) {
            return NextResponse.json({
                connected: true,
                message: "Successfully connected to Zoho CRM",
                expiresIn: data.expires_in,
            });
        }

        return NextResponse.json({
            connected: false,
            message: "Unexpected response from Zoho",
            error: JSON.stringify(data),
        });
    } catch (error: any) {
        return NextResponse.json({
            connected: false,
            message: "Connection check failed",
            error: error.message,
        });
    }
}
