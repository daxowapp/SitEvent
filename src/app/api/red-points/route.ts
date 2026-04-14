/**
 * API Route: Red Points
 * GET /api/red-points?token=<qrToken>
 * 
 * Returns the Red Points summary for a student's registration.
 * Used by the student pass page to display points, tier, and visited booths.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRedPointsSummary } from "@/lib/red-points";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find registration by QR token
    const registration = await prisma.registration.findUnique({
      where: { qrToken: token },
      select: {
        id: true,
        eventId: true,
        event: {
          select: {
            redPointsEnabled: true,
            title: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    if (!registration.event.redPointsEnabled) {
      return NextResponse.json({
        enabled: false,
        message: "Red Points are not enabled for this event",
      });
    }

    const summary = await getRedPointsSummary(
      registration.eventId,
      registration.id
    );

    // Get visited university details
    const visitedBooths = await prisma.boothVisit.findMany({
      where: {
        eventId: registration.eventId,
        registrationId: registration.id,
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get files received from visited universities
    const universityIds = visitedBooths.map((v) => v.universityId);
    const receivedFiles = await prisma.universityFile.findMany({
      where: {
        universityId: { in: universityIds },
        isActive: true,
      },
      select: {
        id: true,
        label: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        university: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      enabled: true,
      eventTitle: registration.event.title,
      ...summary,
      visitedBooths: visitedBooths.map((v) => ({
        universityId: v.universityId,
        universityName: v.university.name,
        universityLogo: v.university.logoUrl,
        pointsAwarded: v.pointsAwarded,
        visitedAt: v.createdAt,
      })),
      receivedFiles,
    });
  } catch (error) {
    console.error("Red Points API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
