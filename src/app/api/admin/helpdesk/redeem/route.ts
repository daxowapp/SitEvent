/**
 * API Route: Help Desk Gift Redemption
 * POST /api/admin/helpdesk/redeem
 * 
 * Admin/staff scans student QR at help desk to redeem a gift.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redeemGift } from "@/app/actions/booth-visit";
import { getRedPointsSummary } from "@/lib/red-points";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be admin type
    if ((session.user as any).type !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { qrToken } = body;

    if (!qrToken) {
      return NextResponse.json(
        { error: "QR token is required" },
        { status: 400 }
      );
    }

    // Find registration
    const registration = await prisma.registration.findUnique({
      where: { qrToken },
      include: {
        registrant: {
          select: { fullName: true, email: true, phone: true },
        },
        event: {
          select: {
            id: true,
            title: true,
            redPointsEnabled: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (!registration.event.redPointsEnabled) {
      return NextResponse.json(
        { error: "Red Points are not enabled for this event" },
        { status: 400 }
      );
    }

    const result = await redeemGift(
      registration.eventId,
      registration.id,
      session.user.id
    );

    if (!result.success) {
      // Still return student info for display
      const summary = await getRedPointsSummary(
        registration.eventId,
        registration.id
      );
      return NextResponse.json(
        {
          error: result.error,
          studentName: registration.registrant.fullName,
          totalPoints: summary.totalPoints,
          currentTier: summary.currentTier,
          giftRedeemed: summary.giftRedeemed,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      studentName: registration.registrant.fullName,
      tier: result.tier,
      totalPoints: result.totalPoints,
    });
  } catch (error) {
    console.error("Help desk redeem error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/helpdesk/redeem?qrToken=xxx
 * Look up student info and points for help desk display (before redeeming)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const qrToken = searchParams.get("qrToken");

    if (!qrToken) {
      return NextResponse.json(
        { error: "QR token is required" },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.findUnique({
      where: { qrToken },
      include: {
        registrant: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            country: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            redPointsEnabled: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const summary = await getRedPointsSummary(
      registration.eventId,
      registration.id
    );

    return NextResponse.json({
      studentName: registration.registrant.fullName,
      studentEmail: registration.registrant.email,
      studentPhone: registration.registrant.phone,
      studentCountry: registration.registrant.country,
      eventTitle: registration.event.title,
      redPointsEnabled: registration.event.redPointsEnabled,
      ...summary,
    });
  } catch (error) {
    console.error("Help desk lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
