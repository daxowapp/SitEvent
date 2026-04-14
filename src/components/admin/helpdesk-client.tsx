"use client";

/**
 * Help Desk Client — Admin/Staff verify and redeem student gifts
 * Uses QR scanner or manual search to find students
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Gift,
  Zap,
  Star,
  CheckCircle2,
  XCircle,
  User,
  Search,
  RotateCcw,
  Loader2,
  PartyPopper,
  AlertCircle,
} from "lucide-react";

interface StudentInfo {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentCountry: string;
  eventTitle: string;
  redPointsEnabled: boolean;
  totalPoints: number;
  boothsVisited: number;
  totalBooths: number;
  currentTier: string;
  nextTier: string | null;
  pointsToNextTier: number;
  progress: number;
  giftRedeemed: boolean;
  redeemedTier: string | null;
}

const tierConfig: Record<string, { emoji: string; label: string; color: string; giftDescription: string }> = {
  NONE: { emoji: "⚪", label: "No Tier", color: "bg-gray-100 text-gray-600", giftDescription: "Not eligible yet" },
  BRONZE: { emoji: "🥉", label: "Bronze", color: "bg-amber-100 text-amber-800", giftDescription: "Sticker / Badge" },
  SILVER: { emoji: "🥈", label: "Silver", color: "bg-gray-200 text-gray-800", giftDescription: "Tote Bag / Notebook" },
  GOLD: { emoji: "🥇", label: "Gold", color: "bg-yellow-100 text-yellow-800", giftDescription: "Power Bank / T-Shirt" },
};

export function HelpDeskClient() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setScanning(false);
  }, []);

  const lookupStudent = useCallback(
    async (qrToken: string) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setStudentInfo(null);
      lastScannedRef.current = qrToken;

      try {
        const res = await fetch(
          `/api/admin/helpdesk/redeem?qrToken=${encodeURIComponent(qrToken)}`
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Student not found");
          return;
        }

        setStudentInfo(data);
        stopCamera();
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [stopCamera]
  );

  const handleRedeem = async () => {
    if (!lastScannedRef.current) return;

    setRedeeming(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/helpdesk/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: lastScannedRef.current }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Redemption failed");
        return;
      }

      setSuccess(
        `${data.tier} gift redeemed for ${data.studentName}! (${data.totalPoints} pts)`
      );
      setStudentInfo(null);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setRedeeming(false);
    }
  };

  const startCamera = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setStudentInfo(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setScanning(true);
      }
    } catch (err) {
      setError("Camera access denied.");
    }
  }, []);

  // QR scanning loop
  useEffect(() => {
    if (!scanning || !cameraReady) return;

    let jsQR: any = null;
    import("jsqr").then((mod) => {
      jsQR = mod.default;
    });

    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current || !jsQR) {
        animationRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        let token = code.data;
        const urlMatch = token.match(/\/r\/([^/?]+)/);
        if (urlMatch) token = urlMatch[1];

        lookupStudent(token);
        return;
      }

      animationRef.current = requestAnimationFrame(scanFrame);
    };

    animationRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [scanning, cameraReady, lookupStudent]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const tier = studentInfo
    ? tierConfig[studentInfo.currentTier] || tierConfig.NONE
    : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">🎁 Help Desk</h1>
        <p className="text-muted-foreground mt-1">
          Scan student QR to verify points and redeem gifts
        </p>
      </div>

      {/* Scanner / Search */}
      {!studentInfo && (
        <>
          <Card>
            <CardContent className="p-0">
              {scanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full aspect-[4/3] object-cover bg-black"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-52 h-52 border-2 border-white/60 rounded-2xl" />
                  </div>
                  {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopCamera}
                      className="bg-white/90"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center space-y-4">
                  <Gift className="w-16 h-16 mx-auto text-red-500" />
                  <Button
                    onClick={startCamera}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Scan Student QR
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Token Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Or enter QR token manually..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualToken.trim()) {
                  lookupStudent(manualToken.trim());
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => manualToken.trim() && lookupStudent(manualToken.trim())}
              disabled={!manualToken.trim() || loading}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setStudentInfo(null);
                  startCamera();
                }}
                className="mt-2"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center space-y-3">
            <PartyPopper className="w-12 h-12 mx-auto text-green-500" />
            <p className="font-semibold text-green-800 text-lg">{success}</p>
            <Button
              onClick={() => {
                setSuccess(null);
                startCamera();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scan Next Student
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Student Info & Redemption */}
      {studentInfo && tier && (
        <div className="space-y-4 animate-fade-up">
          {/* Student Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                {studentInfo.studentName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event</span>
                <span className="font-medium">{studentInfo.eventTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{studentInfo.studentPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country</span>
                <span>{studentInfo.studentCountry}</span>
              </div>
            </CardContent>
          </Card>

          {/* Points & Tier */}
          <Card className={`border-2 ${studentInfo.currentTier === "GOLD" ? "border-yellow-300" : studentInfo.currentTier === "SILVER" ? "border-gray-300" : studentInfo.currentTier === "BRONZE" ? "border-amber-300" : "border-gray-200"}`}>
            <CardContent className="p-5">
              <div className="text-center space-y-2">
                <div className="text-4xl font-black text-red-600">
                  {studentInfo.totalPoints}
                </div>
                <div className="text-sm text-muted-foreground">Red Points</div>
                <Badge className={`${tier.color} text-base px-4 py-1.5`}>
                  {tier.emoji} {tier.label}
                </Badge>
                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mt-2">
                  <Star className="w-4 h-4" />
                  {studentInfo.boothsVisited} / {studentInfo.totalBooths} booths
                </div>
              </div>

              {/* Progress */}
              {studentInfo.nextTier && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{studentInfo.currentTier || "Start"}</span>
                    <span>{studentInfo.nextTier}</span>
                  </div>
                  <Progress value={studentInfo.progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Redemption Section */}
          <Card>
            <CardContent className="p-5">
              {studentInfo.giftRedeemed ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-green-500" />
                  <p className="font-semibold text-green-800">
                    Gift already redeemed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {studentInfo.redeemedTier} tier gift was claimed
                  </p>
                </div>
              ) : studentInfo.currentTier === "NONE" ? (
                <div className="text-center space-y-2">
                  <AlertCircle className="w-10 h-10 mx-auto text-gray-400" />
                  <p className="font-medium text-muted-foreground">
                    Not eligible for a gift yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {studentInfo.pointsToNextTier} more points needed for Bronze
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <Gift className="w-10 h-10 mx-auto text-red-500" />
                  <div>
                    <p className="font-semibold text-lg">
                      Eligible: {tier.emoji} {tier.label} Gift
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tier.giftDescription}
                    </p>
                  </div>
                  <Button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    size="lg"
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {redeeming ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Gift className="w-5 h-5 mr-2" />
                    )}
                    Redeem {tier.label} Gift
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scan Another */}
          <Button
            variant="outline"
            onClick={() => {
              setStudentInfo(null);
              setError(null);
              startCamera();
            }}
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scan Another Student
          </Button>
        </div>
      )}
    </div>
  );
}
