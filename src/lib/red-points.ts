/**
 * Red Points System — Core utilities
 * Handles point calculation, tier determination, and progress tracking
 */

import { prisma } from "./db";

export interface RedPointsSummary {
  totalPoints: number;
  boothsVisited: number;
  totalBooths: number;
  currentTier: "NONE" | "BRONZE" | "SILVER" | "GOLD";
  nextTier: "BRONZE" | "SILVER" | "GOLD" | null;
  pointsToNextTier: number;
  progress: number; // 0-100 percentage toward next tier
  hasCompletionBonus: boolean;
  visitedUniversityIds: string[];
  giftRedeemed: boolean;
  redeemedTier: string | null;
}

/**
 * Calculate complete Red Points summary for a student at an event
 */
export async function getRedPointsSummary(
  eventId: string,
  registrationId: string
): Promise<RedPointsSummary> {
  // Get event config
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      redPointsEnabled: true,
      pointsPerVisit: true,
      completionBonus: true,
      earlyBirdBonus: true,
      earlyBirdCount: true,
      bronzeThreshold: true,
      silverThreshold: true,
      goldThreshold: true,
      universities: {
        where: {
          status: { in: ["ACCEPTED", "INVITED", "REQUESTED"] },
        },
        select: { universityId: true },
      },
    },
  });

  if (!event) {
    return defaultSummary();
  }

  // Get total points from ledger
  const pointsAgg = await prisma.redPointsLedger.aggregate({
    where: { eventId, registrationId },
    _sum: { points: true },
  });

  const totalPoints = pointsAgg._sum.points || 0;

  // Get booth visits
  const boothVisits = await prisma.boothVisit.findMany({
    where: { eventId, registrationId },
    select: { universityId: true },
  });

  const visitedUniversityIds = boothVisits.map((v) => v.universityId);
  const boothsVisited = visitedUniversityIds.length;
  const totalBooths = event.universities.length;

  // Check completion bonus
  const hasCompletionBonus = totalBooths > 0 && boothsVisited >= totalBooths;

  // Determine current tier
  const currentTier = determineTier(totalPoints, event);

  // Determine next tier and progress
  const { nextTier, pointsToNextTier, progress } = calculateProgress(
    totalPoints,
    event
  );

  // Check gift redemption
  const redemption = await prisma.giftRedemption.findFirst({
    where: { eventId, registrationId },
    select: { tier: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    totalPoints,
    boothsVisited,
    totalBooths,
    currentTier,
    nextTier,
    pointsToNextTier,
    progress,
    hasCompletionBonus,
    visitedUniversityIds,
    giftRedeemed: !!redemption,
    redeemedTier: redemption?.tier || null,
  };
}

function determineTier(
  points: number,
  event: { bronzeThreshold: number; silverThreshold: number; goldThreshold: number }
): "NONE" | "BRONZE" | "SILVER" | "GOLD" {
  if (points >= event.goldThreshold) return "GOLD";
  if (points >= event.silverThreshold) return "SILVER";
  if (points >= event.bronzeThreshold) return "BRONZE";
  return "NONE";
}

function calculateProgress(
  points: number,
  event: { bronzeThreshold: number; silverThreshold: number; goldThreshold: number }
): { nextTier: "BRONZE" | "SILVER" | "GOLD" | null; pointsToNextTier: number; progress: number } {
  if (points >= event.goldThreshold) {
    return { nextTier: null, pointsToNextTier: 0, progress: 100 };
  }

  if (points >= event.silverThreshold) {
    const needed = event.goldThreshold - event.silverThreshold;
    const earned = points - event.silverThreshold;
    return {
      nextTier: "GOLD",
      pointsToNextTier: event.goldThreshold - points,
      progress: Math.round((earned / needed) * 100),
    };
  }

  if (points >= event.bronzeThreshold) {
    const needed = event.silverThreshold - event.bronzeThreshold;
    const earned = points - event.bronzeThreshold;
    return {
      nextTier: "SILVER",
      pointsToNextTier: event.silverThreshold - points,
      progress: Math.round((earned / needed) * 100),
    };
  }

  const needed = event.bronzeThreshold;
  return {
    nextTier: "BRONZE",
    pointsToNextTier: event.bronzeThreshold - points,
    progress: needed > 0 ? Math.round((points / needed) * 100) : 0,
  };
}

function defaultSummary(): RedPointsSummary {
  return {
    totalPoints: 0,
    boothsVisited: 0,
    totalBooths: 0,
    currentTier: "NONE",
    nextTier: "BRONZE",
    pointsToNextTier: 30,
    progress: 0,
    hasCompletionBonus: false,
    visitedUniversityIds: [],
    giftRedeemed: false,
    redeemedTier: null,
  };
}
