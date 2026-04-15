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

  
  const playBeep = useCallback((success: boolean) => {
      try {
          const ctx = new AudioContext();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          oscillator.connect(gain);
          gain.connect(ctx.destination);
          oscillator.frequency.value = success ? 880 : 300;
          oscillator.type = "sine";
          gain.gain.value = 0.3;
          oscillator.start();
          oscillator.stop(ctx.currentTime + (success ? 0.15 : 0.3));
      } catch { }
  }, []);

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
          playBeep(false);
          setError(data.error || "Student not found");
          return;
        }

        playBeep(true);
        setStudentInfo(data);
        stopCamera();
      } catch (err) {
        playBeep(false);
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
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
      });

      if (code && !loading) {
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
              <div className="relative aspect-[3/4] md:aspect-square rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-900">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover bg-black"
                  playsInline
                  autoPlay
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 z-10 p-6 text-center w-full h-full">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                        <Gift className="w-10 h-10 text-white/60" />
                    </div>
                    <Button
                        onClick={startCamera}
                        size="lg"
                        className="rounded-full px-10 py-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-xl shadow-red-500/30 transform hover:scale-105 transition-all"
                    >
                        <Camera className="w-5 h-5 mr-2" />
                        Start Scanning
                    </Button>
                    <p className="text-white/40 text-xs mt-4">For Helpdesk Gift Redemption</p>
                  </div>
                )}

                {scanning && (
                  <>
                    {/* Scanner Overlay UI */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Green scanning corners */}
                      <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-52 h-52 relative">
                              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-2xl" />
                              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-2xl" />
                              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-2xl" />
                              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-2xl" />
                              {/* Scan line */}
                              <div className="absolute left-2 right-2 h-0.5 bg-green-400/80 shadow-[0_0_15px_rgba(74,222,128,0.6)] animate-[scan_2s_ease-in-out_infinite]" />
                          </div>
                      </div>

                      {/* Status pill */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 mt-2">
                          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-white text-xs font-medium">Scanning Active</span>
                          </div>
                      </div>
                    </div>

                    {loading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      </div>
                    )}
                    <style jsx>{`
                        @keyframes scan {
                            0%, 100% { top: 8px; }
                            50% { top: calc(100% - 8px); }
                        }
                    `}</style>
                    <div className="absolute bottom-4 left-0 right-0 text-center z-20 pointer-events-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={stopCamera}
                        className="rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg px-6"
                      >
                        Cancel Scanning
                      </Button>
                    </div>
                  </>
                )}
              </div>
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
        <div className="space-y-6 animate-fade-up pb-10">
          {/* Student Info Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm relative overflow-hidden">
             {/* decorative top bar */}
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-red-400" />
             
             <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center border border-red-100 flex-shrink-0 mt-1">
                    <User className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold font-display text-gray-900 tracking-tight">{studentInfo.studentName}</h2>
                    <p className="text-sm text-gray-500 font-medium">{studentInfo.studentEmail}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                 <div className="space-y-1">
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Event</span>
                     <p className="text-sm font-medium text-gray-900 leading-tight">{studentInfo.eventTitle}</p>
                 </div>
                 <div className="space-y-1">
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact</span>
                     <p className="text-sm font-medium text-gray-900">{studentInfo.studentPhone || "N/A"}</p>
                 </div>
                 <div className="space-y-1 md:col-span-2">
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Country</span>
                     <p className="text-sm font-medium text-gray-900">{studentInfo.studentCountry}</p>
                 </div>
             </div>
          </div>

          {/* Red Points Bento Box */}
          <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-6 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.1)] text-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-red-500/5 blur-xl transition-all opacity-100" />
                   <div className="relative">
                       <div className="flex justify-center mb-1"><Zap className="w-5 h-5 text-red-500/50 fill-red-500/10" /></div>
                       <div className="text-6xl font-black font-display text-red-600 tracking-tighter">{studentInfo.totalPoints}</div>
                       <div className="text-[10px] uppercase tracking-[0.2em] text-red-900/60 font-bold mt-2">Total Red Points</div>
                   </div>
              </div>
              <div className="col-span-2 md:col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-center items-center text-center">
                   <Badge className={`${tier.color} text-lg px-5 py-2 font-bold mb-3 border-2 border-black/5`}>
                        {tier.emoji} {tier.label} Tier
                   </Badge>
                   <div className="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-gray-500">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {studentInfo.boothsVisited} / {studentInfo.totalBooths} Booths Scanned
                   </div>
              </div>
              
              {studentInfo.nextTier && (
                  <div className="col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex justify-between items-end mb-3">
                          <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress to {studentInfo.nextTier}</p>
                          </div>
                          <div className="text-sm font-bold text-red-600">{studentInfo.pointsToNextTier} pts left</div>
                      </div>
                      <Progress value={studentInfo.progress} className="h-2.5 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-red-400" />
                      <div className="flex justify-between text-xs font-semibold text-gray-400 mt-2">
                        <span>{studentInfo.currentTier || "Start"}</span>
                        <span>{studentInfo.nextTier}</span>
                      </div>
                  </div>
              )}
          </div>

          {/* Redemption Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {studentInfo.giftRedeemed ? (
                <div className="text-center space-y-3 py-2">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                      <p className="font-bold text-gray-900 text-xl tracking-tight">
                        Gift Already Redeemed!
                      </p>
                      <p className="text-sm font-medium text-gray-500 mt-1">
                        They claimed the <strong className="text-green-700">{studentInfo.redeemedTier}</strong> tier gift.
                      </p>
                  </div>
                </div>
              ) : studentInfo.currentTier === "NONE" ? (
                <div className="text-center space-y-3 py-2">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                      <p className="font-bold text-gray-900 text-xl tracking-tight">
                        Not Eligible Yet
                      </p>
                      <p className="text-sm font-medium text-gray-500 mt-1">
                        Collect <strong className="text-red-500">{studentInfo.pointsToNextTier} more pts</strong> to unlock a gift.
                      </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100 relative group animate-pulse">
                      <div className="absolute inset-0 bg-red-400/20 rounded-full blur-md" />
                      <Gift className="w-8 h-8 text-red-500 relative z-10" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl font-display tracking-tight text-gray-900">
                      {tier.emoji} {tier.label} Gift
                    </h3>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                      {tier.giftDescription}
                    </p>
                  </div>
                  <Button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    size="lg"
                    className="w-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20 py-6 text-lg font-bold rounded-xl transition-all hover:scale-[1.02]"
                  >
                    {redeeming ? (
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    ) : (
                      <Gift className="w-6 h-6 mr-2" />
                    )}
                    Mark {tier.label} Gift as Received
                  </Button>
                </div>
              )}
          </div>

          {/* Scan Another */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setStudentInfo(null);
              setError(null);
              startCamera();
            }}
            className="w-full py-6 text-base font-bold rounded-xl border-2 hover:bg-gray-50 transition-colors bg-white mt-4 shadow-sm"
          >
            <Camera className="w-5 h-5 mr-2 text-gray-500" />
            Scan Next Student
          </Button>
        </div>
      )}
    </div>
  );
}
