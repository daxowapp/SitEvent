"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Camera,
    CheckCircle2,
    XCircle,
    User,
    Mail,
    Phone,
    GraduationCap,
    Zap,
    Hash,
} from "lucide-react";

interface ScanResult {
    success: boolean;
    message: string;
    lead?: {
        name: string;
        email: string;
        phone: string;
        country?: string;
        academicInterest?: string;
        pointsAwarded?: number;
        totalPoints?: number;
        boothsVisited?: number;
        totalBooths?: number;
        currentTier?: string;
        alreadyVisited?: boolean;
    };
    timestamp: number;
}

export default function LeadScannerPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
    const [manualToken, setManualToken] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanCount, setScanCount] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const lastScannedRef = useRef<string>("");
    const cooldownRef = useRef<boolean>(false);

    // Sound feedback - create a short beep
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

    // Vibration feedback
    const vibrate = useCallback((pattern: number[]) => {
        try {
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
            }
        } catch { }
    }, []);

    const processScan = useCallback(async (token: string) => {
        // Prevent duplicate rapid scans of the same QR
        if (cooldownRef.current || token === lastScannedRef.current) return;
        cooldownRef.current = true;
        lastScannedRef.current = token;

        setIsProcessing(true);

        try {
            const res = await fetch("/api/university/booth-scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrToken: token }),
            });

            const data = await res.json();

            if (!res.ok) {
                const result: ScanResult = {
                    success: false,
                    message: data.error || "Scan failed",
                    timestamp: Date.now(),
                };
                setLastResult(result);
                setScanHistory(prev => [result, ...prev].slice(0, 100));
                playBeep(false);
                vibrate([100, 50, 100]);
                toast.error(data.error || "Scan failed");
            } else {
                const result: ScanResult = {
                    success: true,
                    message: data.alreadyVisited ? "Already visited" : "Lead captured!",
                    lead: {
                        name: data.studentName,
                        email: data.studentEmail,
                        phone: data.studentPhone,
                        country: data.studentCountry,
                        academicInterest: data.interestedMajor,
                        pointsAwarded: data.pointsAwarded,
                        totalPoints: data.totalPoints,
                        boothsVisited: data.boothsVisited,
                        totalBooths: data.totalBooths,
                        currentTier: data.currentTier,
                        alreadyVisited: data.alreadyVisited,
                    },
                    timestamp: Date.now(),
                };
                setLastResult(result);
                setScanHistory(prev => [result, ...prev].slice(0, 100));

                if (data.alreadyVisited) {
                    playBeep(false);
                    vibrate([50, 50, 50]);
                    toast.warning(`Already visited: ${data.studentName}`);
                } else {
                    playBeep(true);
                    vibrate([200]);
                    setScanCount(c => c + 1);
                    toast.success(`✓ ${data.studentName}`);
                }
            }
        } catch (err) {
            const result: ScanResult = {
                success: false,
                message: "Network error",
                timestamp: Date.now(),
            };
            setLastResult(result);
            playBeep(false);
            toast.error("Network error. Check connection.");
        } finally {
            setIsProcessing(false);
            // Cooldown: 1.5s before allowing the same QR code, 0.5s for different
            setTimeout(() => {
                cooldownRef.current = false;
            }, 500);
            setTimeout(() => {
                lastScannedRef.current = "";
            }, 1500);
        }
    }, [playBeep, vibrate]);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsScanning(true);
            }
        } catch (error) {
            toast.error("Camera access denied. Please allow camera permission.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    }, []);

    // Continuous scanning loop using jsQR
    useEffect(() => {
        if (!isScanning) return;

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

            if (code && !cooldownRef.current) {
                let token = code.data;
                const urlMatch = token.match(/\/r\/([^/?]+)/);
                if (urlMatch) {
                    token = urlMatch[1];
                }
                processScan(token);
            }

            // KEEP scanning continuously
            animationRef.current = requestAnimationFrame(scanFrame);
        };

        animationRef.current = requestAnimationFrame(scanFrame);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isScanning, processScan]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const handleManualSubmit = () => {
        if (manualToken.trim()) {
            const token = manualToken.includes("/r/")
                ? manualToken.split("/r/")[1]
                : manualToken.trim();
            processScan(token);
            setManualToken("");
        }
    };

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    return (
        <div className="max-w-lg mx-auto space-y-4 pb-20">
            {/* Compact Header with Counter */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lead Scanner</h1>
                    <p className="text-sm text-gray-500">Scan student QR codes</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-center px-4 py-2 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{scanCount}</div>
                        <div className="text-[10px] uppercase tracking-wider text-red-500 font-semibold">Leads</div>
                    </div>
                </div>
            </div>

            {/* Scanner — Full Width, Always Visible */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-200">
                <video
                    ref={videoRef}
                    className="w-full aspect-[4/3] object-cover bg-gray-900"
                    playsInline
                    muted
                    autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning Overlay */}
                {isScanning && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* QR Target Zone */}
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

                        {/* Processing indicator */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-xl">
                                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="font-semibold text-gray-900">Processing...</span>
                                </div>
                            </div>
                        )}

                        {/* Status pill */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2">
                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-white text-xs font-medium">Scanning Active</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Camera Off State */}
                {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                            <Camera className="w-10 h-10 text-white/60" />
                        </div>
                        <Button
                            onClick={startCamera}
                            size="lg"
                            className="rounded-full px-10 py-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-xl shadow-red-500/30 transform hover:scale-105 transition-all"
                        >
                            <Camera className="w-5 h-5 mr-2" />
                            Start Scanning
                        </Button>
                        <p className="text-white/40 text-xs mt-4">Camera stays active between scans</p>
                    </div>
                )}

                {/* Stop button */}
                {isScanning && (
                    <div className="absolute bottom-4 right-4">
                        <Button
                            onClick={stopCamera}
                            size="sm"
                            variant="secondary"
                            className="rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg text-xs px-4"
                        >
                            Stop
                        </Button>
                    </div>
                )}
            </div>

            {/* Last Scan Result — Compact Flash Card */}
            {lastResult && (
                <div
                    className={`rounded-2xl border-2 p-4 transition-all duration-300 animate-in slide-in-from-bottom-3 ${
                        lastResult.success && !lastResult.lead?.alreadyVisited
                            ? "bg-green-50 border-green-300"
                            : lastResult.success && lastResult.lead?.alreadyVisited
                            ? "bg-amber-50 border-amber-300"
                            : "bg-red-50 border-red-300"
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            lastResult.success && !lastResult.lead?.alreadyVisited
                                ? "bg-green-200 text-green-700"
                                : lastResult.success && lastResult.lead?.alreadyVisited
                                ? "bg-amber-200 text-amber-700"
                                : "bg-red-200 text-red-700"
                        }`}>
                            {lastResult.success ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            {lastResult.lead ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 truncate">{lastResult.lead.name}</h3>
                                        {lastResult.lead.pointsAwarded !== undefined && lastResult.lead.pointsAwarded > 0 && (
                                            <Badge className="bg-red-600 text-white ml-2 flex-shrink-0">
                                                <Zap className="w-3 h-3 mr-1" />
                                                +{lastResult.lead.pointsAwarded}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />{lastResult.lead.email}
                                        </span>
                                        {lastResult.lead.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />{lastResult.lead.phone}
                                            </span>
                                        )}
                                    </div>
                                    {lastResult.lead.academicInterest && (
                                        <div className="mt-1.5">
                                            <Badge variant="outline" className="text-xs bg-white">
                                                <GraduationCap className="w-3 h-3 mr-1" />
                                                {lastResult.lead.academicInterest}
                                            </Badge>
                                        </div>
                                    )}
                                    {lastResult.lead.alreadyVisited && (
                                        <p className="text-xs text-amber-600 font-medium mt-1">⚠️ Already visited your booth</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm font-medium text-red-700">{lastResult.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Entry — Compact */}
            <div className="flex gap-2">
                <Input
                    placeholder="Enter QR token or URL..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                    className="bg-white border-gray-200 h-11"
                />
                <Button
                    onClick={handleManualSubmit}
                    disabled={!manualToken.trim() || isProcessing}
                    className="bg-gray-900 hover:bg-black text-white h-11 px-5"
                >
                    Submit
                </Button>
            </div>

            {/* Scan History — Compact List */}
            {scanHistory.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            Session History
                        </h3>
                        <Badge variant="outline" className="text-xs">
                            {scanHistory.length} scans
                        </Badge>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                        {scanHistory.map((scan, i) => (
                            <div
                                key={`${scan.timestamp}-${i}`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition-colors"
                            >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    scan.success && !scan.lead?.alreadyVisited ? "bg-green-500"
                                        : scan.success ? "bg-amber-500"
                                        : "bg-red-500"
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        {scan.lead?.name || "Unknown"}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">
                                        {scan.lead?.email || scan.message}
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                                    {formatTime(scan.timestamp)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inline animation keyframes */}
            <style jsx>{`
                @keyframes scan {
                    0%, 100% { top: 8px; }
                    50% { top: calc(100% - 8px); }
                }
            `}</style>
        </div>
    );
}
