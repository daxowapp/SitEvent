"use client";

/**
 * Red Points Widget — Shows on student's digital pass page
 * Displays points balance, tier progress, visited booths, and received files
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  Star,
  Trophy,
  CheckCircle2,
  Circle,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Gift,
  Sparkles,
  Loader2,
} from "lucide-react";

interface VisitedBooth {
  universityId: string;
  universityName: string;
  universityLogo: string | null;
  pointsAwarded: number;
  visitedAt: string;
}

interface ReceivedFile {
  id: string;
  label: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  university: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface RedPointsData {
  enabled: boolean;
  eventTitle?: string;
  totalPoints: number;
  boothsVisited: number;
  totalBooths: number;
  currentTier: string;
  nextTier: string | null;
  pointsToNextTier: number;
  progress: number;
  hasCompletionBonus: boolean;
  giftRedeemed: boolean;
  redeemedTier: string | null;
  visitedBooths: VisitedBooth[];
  receivedFiles: ReceivedFile[];
}

interface Props {
  qrToken: string;
}

const tierConfig = {
  NONE: {
    color: "text-gray-400",
    bg: "bg-gray-50",
    border: "border-gray-200",
    emoji: "⚪",
    label: "No Tier",
  },
  BRONZE: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    emoji: "🥉",
    label: "Bronze",
  },
  SILVER: {
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-300",
    emoji: "🥈",
    label: "Silver",
  },
  GOLD: {
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    emoji: "🥇",
    label: "Gold",
  },
};

export function RedPointsWidget({ qrToken }: Props) {
  const [data, setData] = useState<RedPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooths, setShowBooths] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/red-points?token=${qrToken}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch Red Points:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Refresh every 30 seconds (for live updates during event)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [qrToken]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.enabled) {
    return null; // Don't show if Red Points not enabled
  }

  const tier = tierConfig[data.currentTier as keyof typeof tierConfig] || tierConfig.NONE;

  return (
    <div className="space-y-4">
      {/* Main Points Card */}
      <Card className={`${tier.border} overflow-hidden`}>
        {/* Points Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-300" />
              <span className="text-lg font-bold">Red Points</span>
            </div>
            <Badge className={`${tier.bg} ${tier.color} text-sm px-3 py-1`}>
              {tier.emoji} {tier.label}
            </Badge>
          </div>
          <div className="mt-3 text-center">
            <div className="text-5xl font-black">{data.totalPoints}</div>
            <div className="text-red-200 text-sm mt-1">points earned</div>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Progress to Next Tier */}
          {data.nextTier && (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">
                  Progress to{" "}
                  {tierConfig[data.nextTier as keyof typeof tierConfig]?.emoji}{" "}
                  {data.nextTier}
                </span>
                <span className="font-medium">
                  {data.pointsToNextTier} pts to go
                </span>
              </div>
              <Progress value={data.progress} className="h-2.5" />
            </div>
          )}

          {/* Booths Visited */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="font-medium">Booths Visited</span>
            </div>
            <span className="text-lg font-bold">
              {data.boothsVisited}{" "}
              <span className="text-muted-foreground font-normal text-sm">
                / {data.totalBooths}
              </span>
            </span>
          </div>

          {/* Completion Badge */}
          {data.hasCompletionBonus && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Trophy className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium text-sm">
                🎉 All booths visited! Completion bonus earned!
              </span>
            </div>
          )}

          {/* Gift Redemption Status */}
          {data.giftRedeemed ? (
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Gift className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800 font-medium text-sm">
                Gift redeemed ({data.redeemedTier} tier) ✅
              </span>
            </div>
          ) : data.currentTier !== "NONE" ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Gift className="w-5 h-5 text-amber-600" />
              <span className="text-amber-800 font-medium text-sm">
                You&apos;ve earned a {tier.emoji} {tier.label} gift! Visit the Help
                Desk to claim it.
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Visited Booths List */}
      {data.visitedBooths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <button
              onClick={() => setShowBooths(!showBooths)}
              className="w-full flex items-center justify-between"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Visited Universities ({data.visitedBooths.length})
              </CardTitle>
              {showBooths ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </CardHeader>
          {showBooths && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {data.visitedBooths.map((booth) => (
                  <div
                    key={booth.universityId}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">
                        {booth.universityName}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{booth.pointsAwarded} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Received Files */}
      {data.receivedFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="w-full flex items-center justify-between"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                Brochures & Catalogs ({data.receivedFiles.length})
              </CardTitle>
              {showFiles ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </CardHeader>
          {showFiles && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {data.receivedFiles.map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {file.university.name}
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </a>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
