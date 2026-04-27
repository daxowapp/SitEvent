"use client";

/**
 * University Booth Scanner — Client Component
 * University reps use this to scan student QR codes at their booth.
 * Awards Red Points, captures leads, and sends brochures.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Star,
  Zap,
  RotateCcw,
  FileText,
  User,
  MapPin,
  GraduationCap,
  AlertCircle,
} from "lucide-react";

interface ScanResult {
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
}

export function BoothScannerClient() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

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

  const processScan = useCallback(
    async (qrToken: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/university/booth-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrToken, note: note || undefined }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Scan failed");
          return;
        }

        setScanResult(data);
        stopCamera();
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [note, stopCamera]
  );

  const startCamera = useCallback(async () => {
    setError(null);
    setScanResult(null);
    setNote("");

    try {
      // Try back camera first, fall back to any camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback: any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      // Store stream and show video element FIRST
      streamRef.current = stream;
      setScanning(true);
      // The effect below will connect the stream to the video element
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? "Camera access denied. Please allow camera in your browser settings."
        : err?.name === "NotFoundError"
        ? "No camera found on this device."
        : `Camera error: ${err?.message || "Unknown error"}. Try refreshing the page.`;
      setError(msg);
    }
  }, []);

  // Connect stream to video element once it's mounted
  useEffect(() => {
    if (!scanning || !streamRef.current) return;

    const connectStream = async () => {
      // Wait for video element to mount after scanning=true render
      await new Promise((r) => setTimeout(r, 100));

      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        try {
          await videoRef.current.play();
        } catch {
          await new Promise((r) => setTimeout(r, 300));
          await videoRef.current?.play();
        }
        setCameraReady(true);
      }
    };

    connectStream();
  }, [scanning]);

  // QR scanning loop using jsQR
  useEffect(() => {
    if (!scanning || !cameraReady) return;

    let jsQR: any = null;

    // Dynamically import jsQR
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
        // Extract QR token from URL or raw token
        let token = code.data;
        // If it's a URL like https://domain.com/r/TOKEN, extract the token
        const urlMatch = token.match(/\/r\/([^/?]+)/);
        if (urlMatch) {
          token = urlMatch[1];
        }

        processScan(token);
        return; // Stop scanning
      }

      animationRef.current = requestAnimationFrame(scanFrame);
    };

    animationRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scanning, cameraReady, processScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const tierColors: Record<string, string> = {
    NONE: "bg-gray-100 text-gray-700",
    BRONZE: "bg-amber-100 text-amber-800",
    SILVER: "bg-gray-200 text-gray-800",
    GOLD: "bg-yellow-100 text-yellow-800",
  };

  const tierEmojis: Record<string, string> = {
    NONE: "⚪",
    BRONZE: "🥉",
    SILVER: "🥈",
    GOLD: "🥇",
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Booth Scanner</h1>
        <p className="text-muted-foreground mt-1">
          Scan student QR codes to award Red Points & share brochures
        </p>
      </div>

      {/* Scanner Area */}
      {!scanResult && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {scanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full aspect-[4/3] object-cover bg-black"
                  playsInline
                  autoPlay
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-white/70 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-xl" />
                    {/* Scanning line animation */}
                    <div className="absolute left-2 right-2 h-0.5 bg-red-500/60 animate-scan-line" />
                  </div>
                </div>

                {loading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-lg font-semibold animate-pulse">
                      Processing...
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    className="bg-white/90 backdrop-blur"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-medium">Ready to Scan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Point the camera at a student&apos;s QR pass
                  </p>
                </div>
                <Button
                  onClick={startCamera}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Scanning
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
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

      {/* Scan Result */}
      {scanResult && (
        <div className="space-y-4 animate-fade-up">
          {/* Status Banner */}
          <Card
            className={
              scanResult.alreadyVisited
                ? "border-amber-200 bg-amber-50"
                : "border-green-200 bg-green-50"
            }
          >
            <CardContent className="p-4 flex items-center gap-3">
              {scanResult.alreadyVisited ? (
                <>
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                  <div>
                    <p className="font-semibold text-amber-800">
                      Already Visited
                    </p>
                    <p className="text-sm text-amber-600">
                      This student has already visited your booth
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-800">
                      Scan Successful!
                    </p>
                    <p className="text-sm text-green-600">
                      +{scanResult.pointsAwarded} Red Points awarded
                      {scanResult.filesCount > 0 &&
                        ` • ${scanResult.filesCount} files shared`}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Student Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold">{scanResult.studentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Country
                </span>
                <span>{scanResult.studentCountry}</span>
              </div>
              {scanResult.interestedMajor && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Interest
                  </span>
                  <span>{scanResult.interestedMajor}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  <span className="font-medium">Red Points</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">
                    {scanResult.totalPoints}
                  </span>
                  <Badge
                    className={tierColors[scanResult.currentTier] || tierColors.NONE}
                  >
                    {tierEmojis[scanResult.currentTier]} {scanResult.currentTier}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5" />
                <span>
                  {scanResult.boothsVisited} / {scanResult.totalBooths} booths
                  visited
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Scan Another */}
          <Button
            onClick={() => {
              setScanResult(null);
              setNote("");
              startCamera();
            }}
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Next Student
          </Button>
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line {
          0%,
          100% {
            top: 8px;
          }
          50% {
            top: calc(100% - 8px);
          }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
