/**
 * API Route: Booth Scan
 * POST /api/university/booth-scan
 * 
 * Called by university scanner to process a student QR scan at their booth.
 * Awards Red Points, records booth visit, and makes brochures available.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processBoothScan } from "@/app/actions/booth-visit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be a university user
    if ((session.user as any).type !== "UNIVERSITY") {
      return NextResponse.json(
        { error: "Only university users can scan at booths" },
        { status: 403 }
      );
    }

    const universityId = (session.user as any).universityId;
    if (!universityId) {
      return NextResponse.json(
        { error: "University not found for this user" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { qrToken, note } = body;

    if (!qrToken) {
      return NextResponse.json(
        { error: "QR token is required" },
        { status: 400 }
      );
    }

    const result = await processBoothScan(
      qrToken,
      universityId,
      session.user.id,
      note
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Booth scan API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
