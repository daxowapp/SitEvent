"use server";

/**
 * Booth Visit Server Actions
 * Handles university scanning student QR, awarding points, and sending brochures
 */

import { prisma } from "@/lib/db";
import { getRedPointsSummary } from "@/lib/red-points";
import { sendConfirmationEmail, sendBrochuresEmail } from "@/lib/email";

interface BoothScanResult {
  success: boolean;
  error?: string;
  data?: {
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    studentCountry: string;
    interestedMajor: string | null;
    pointsAwarded: number;
    totalPoints: number;
    boothsVisited: number;
    totalBooths: number;
    currentTier: string;
    alreadyVisited: boolean;
    filesCount: number;
  };
}

/**
 * Process a booth scan: university scans student QR
 * - Awards Red Points
 * - Sends brochures (makes available on pass)
 * - Creates lead in university profile
 */
export async function processBoothScan(
  qrToken: string,
  universityId: string,
  scannedById: string,
  note?: string
): Promise<BoothScanResult> {
  try {
    // Find registration by QR token
    const registration = await prisma.registration.findUnique({
      where: { qrToken },
      include: {
        registrant: true,
        event: {
          select: {
            id: true,
            title: true,
            redPointsEnabled: true,
            pointsPerVisit: true,
            completionBonus: true,
            earlyBirdBonus: true,
            earlyBirdCount: true,
            bronzeThreshold: true,
            silverThreshold: true,
            goldThreshold: true,
            universities: {
              where: { status: { in: ["ACCEPTED", "INVITED", "REQUESTED"] } },
              select: { universityId: true },
            },
          },
        },
      },
    });

    if (!registration) {
      return { success: false, error: "Invalid QR code. Student not found." };
    }

    if (registration.status === "CANCELLED") {
      return { success: false, error: "This registration has been cancelled." };
    }

    // Check if university is participating in this event
    const isParticipating = registration.event.universities.some(
      (u) => u.universityId === universityId
    );
    if (!isParticipating) {
      return {
        success: false,
        error: "Your university is not participating in this event.",
      };
    }

    // Check for duplicate visit
    const existingVisit = await prisma.boothVisit.findUnique({
      where: {
        eventId_registrationId_universityId: {
          eventId: registration.eventId,
          registrationId: registration.id,
          universityId,
        },
      },
    });

    if (existingVisit) {
      // Already visited — return student info but no new points
      const summary = await getRedPointsSummary(
        registration.eventId,
        registration.id
      );

      return {
        success: true,
        data: {
          studentName: registration.registrant.fullName,
          studentEmail: registration.registrant.email,
          studentPhone: registration.registrant.phone,
          studentCountry: registration.registrant.country,
          interestedMajor: registration.registrant.interestedMajor,
          pointsAwarded: 0,
          totalPoints: summary.totalPoints,
          boothsVisited: summary.boothsVisited,
          totalBooths: summary.totalBooths,
          currentTier: summary.currentTier,
          alreadyVisited: true,
          filesCount: 0,
        },
      };
    }

    // Calculate points to award
    let pointsToAward = 0;
    const pointLedgerEntries: {
      action: "BOOTH_VISIT" | "EARLY_BIRD_BONUS" | "COMPLETION_BONUS";
      points: number;
      description: string;
      referenceId?: string;
    }[] = [];

    if (registration.event.redPointsEnabled) {
      // Base points for visit
      pointsToAward += registration.event.pointsPerVisit;
      pointLedgerEntries.push({
        action: "BOOTH_VISIT",
        points: registration.event.pointsPerVisit,
        description: `Visited university booth`,
      });

      // Count existing visits for early bird bonus
      const existingVisitsCount = await prisma.boothVisit.count({
        where: {
          eventId: registration.eventId,
          registrationId: registration.id,
        },
      });

      // Early bird bonus (first N visits)
      if (
        existingVisitsCount < registration.event.earlyBirdCount &&
        registration.event.earlyBirdBonus > 0
      ) {
        pointsToAward += registration.event.earlyBirdBonus;
        pointLedgerEntries.push({
          action: "EARLY_BIRD_BONUS",
          points: registration.event.earlyBirdBonus,
          description: `Early bird bonus (visit #${existingVisitsCount + 1})`,
        });
      }

      // Check if this visit completes all booths
      const totalUniversities = registration.event.universities.length;
      if (
        existingVisitsCount + 1 >= totalUniversities &&
        totalUniversities > 0 &&
        registration.event.completionBonus > 0
      ) {
        pointsToAward += registration.event.completionBonus;
        pointLedgerEntries.push({
          action: "COMPLETION_BONUS",
          points: registration.event.completionBonus,
          description: `Visited all ${totalUniversities} universities! 🎉`,
        });
      }
    }

    // Get university files count
    // Get university files count and files themselves
    const files = await prisma.universityFile.findMany({
      where: { universityId, isActive: true },
      select: { label: true, fileUrl: true }
    });
    const filesCount = files.length;


    // Create booth visit + points in a transaction
    const boothVisit = await prisma.boothVisit.create({
      data: {
        eventId: registration.eventId,
        registrationId: registration.id,
        universityId,
        scannedById,
        pointsAwarded: pointsToAward,
        note: note || null,
        filesSentAt: filesCount > 0 ? new Date() : null,
      },
    });

    // Create points ledger entries
    if (pointLedgerEntries.length > 0) {
      await prisma.redPointsLedger.createMany({
        data: pointLedgerEntries.map((entry) => ({
          eventId: registration.eventId,
          registrationId: registration.id,
          action: entry.action,
          points: entry.points,
          referenceId: boothVisit.id,
          description: entry.description,
        })),
      });
    }

    // Identify university name for the email
    let uniName = "the University";
    const uniInfo = await prisma.university.findUnique({
      where: { id: universityId },
      select: { name: true }
    });
    if (uniInfo) uniName = uniInfo.name;

    // Asynchronously send brochures via email if any exist
    if (files.length > 0) {
      // Intentionally not awaiting to avoid blocking UI during fast scanning
      sendBrochuresEmail({
        to: registration.registrant.email,
        studentName: registration.registrant.fullName,
        universityName: uniName,
        files: files.map(f => ({ label: f.label, fileUrl: f.fileUrl }))
      }).catch(err => {
        console.error("Failed to send async brochures email in boothScan:", err);
      });
    }

    // Get updated summary
    const summary = await getRedPointsSummary(
      registration.eventId,
      registration.id
    );

    return {
      success: true,
      data: {
        studentName: registration.registrant.fullName,
        studentEmail: registration.registrant.email,
        studentPhone: registration.registrant.phone,
        studentCountry: registration.registrant.country,
        interestedMajor: registration.registrant.interestedMajor,
        pointsAwarded: pointsToAward,
        totalPoints: summary.totalPoints,
        boothsVisited: summary.boothsVisited,
        totalBooths: summary.totalBooths,
        currentTier: summary.currentTier,
        alreadyVisited: false,
        filesCount,
      },
    };
  } catch (error) {
    console.error("Booth scan error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get all booth visits (leads) for a university at an event
 */
export async function getUniversityLeads(
  universityId: string,
  eventId: string
) {
  const visits = await prisma.boothVisit.findMany({
    where: { universityId, eventId },
    include: {
      registration: {
        include: {
          registrant: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              country: true,
              city: true,
              nationality: true,
              levelOfStudy: true,
              interestedMajor: true,
              standardizedMajor: true,
              majorCategory: true,
              gender: true,
            },
          },
        },
      },
      scannedBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return visits;
}

/**
 * Redeem a gift at the help desk
 */
export async function redeemGift(
  eventId: string,
  registrationId: string,
  redeemedById: string
): Promise<{
  success: boolean;
  error?: string;
  tier?: string;
  totalPoints?: number;
}> {
  try {
    // Check if already redeemed
    const existing = await prisma.giftRedemption.findFirst({
      where: { eventId, registrationId },
    });

    if (existing) {
      return {
        success: false,
        error: `Gift already redeemed (${existing.tier} tier).`,
      };
    }

    // Get points summary
    const summary = await getRedPointsSummary(eventId, registrationId);

    if (summary.currentTier === "NONE") {
      return {
        success: false,
        error: "Student hasn't earned enough points for a gift yet.",
      };
    }

    // Create redemption record
    await prisma.giftRedemption.create({
      data: {
        eventId,
        registrationId,
        tier: summary.currentTier as "BRONZE" | "SILVER" | "GOLD",
        pointsAtRedemption: summary.totalPoints,
        redeemedById,
      },
    });

    return {
      success: true,
      tier: summary.currentTier,
      totalPoints: summary.totalPoints,
    };
  } catch (error) {
    console.error("Gift redemption error:", error);
    return { success: false, error: "Failed to process redemption." };
  }
}
