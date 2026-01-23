import { NextRequest, NextResponse } from "next/server";
import { generateQrDataUrl } from "@/lib/qr";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        const qrDataUrl = await generateQrDataUrl(token);

        return NextResponse.json({ qrDataUrl });
    } catch (error) {
        console.error("QR generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate QR code" },
            { status: 500 }
        );
    }
}
