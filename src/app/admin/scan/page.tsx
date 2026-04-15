"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getLiveStats } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Camera } from "lucide-react";

interface Event {
    id: string;
    title: string;
}

interface CheckInResult {
    success: boolean;
    message: string;
    registration?: {
        studentName: string;
        email: string;
        alreadyCheckedIn: boolean;
        checkedInAt?: string;
    };
}

function ScannerContent() {
    const searchParams = useSearchParams();
    const initialEventId = searchParams.get("eventId");

    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || "");
    const [isScanning, setIsScanning] = useState(false);
    const [manualToken, setManualToken] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
    const [totalCheckins, setTotalCheckins] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const lastScannedRef = useRef<string>("");
    const cooldownRef = useRef<boolean>(false);

    // Sound feedback
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

    // Load events on mount
    useEffect(() => {
        fetch("/api/admin/events")
            .then((res) => res.json())
            .then((data) => setEvents(data.events || []))
            .catch(console.error);
    }, []);

    // Poll for global stats
    useEffect(() => {
        if (!selectedEventId) return;

        // Initial fetch
        getLiveStats(selectedEventId).then(data => setTotalCheckins(data.checkInCount));

        // Poll every 5s
        const interval = setInterval(() => {
            getLiveStats(selectedEventId).then(data => setTotalCheckins(data.checkInCount));
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedEventId]);

    // Handle QR scan result
    const handleScan = useCallback(async (token: string) => {
        if (!selectedEventId) {
            toast.error("Please select an event first");
            return;
        }

        if (cooldownRef.current || token === lastScannedRef.current) return;
        cooldownRef.current = true;
        lastScannedRef.current = token;

        try {
            const response = await fetch("/api/admin/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: selectedEventId,
                    token,
                }),
            });

            const result: CheckInResult = await response.json();
            setLastResult(result);

            if (result.success) {
                if (result.registration?.alreadyCheckedIn) {
                    playBeep(false);
                    vibrate([50, 50, 50]);
                    toast.warning(`Already checked in: ${result.registration.studentName}`);
                } else {
                    playBeep(true);
                    vibrate([200]);
                    toast.success(`Checked in: ${result.registration?.studentName}`);
                    // Optimistic update
                    setTotalCheckins(c => c + 1);
                }
            } else {
                playBeep(false);
                vibrate([100, 50, 100]);
                toast.error(result.message);
            }
        } catch (error) {
            playBeep(false);
            toast.error("Check-in failed");
        } finally {
            // Cooldown logic
            setTimeout(() => {
                cooldownRef.current = false;
            }, 500);
            setTimeout(() => {
                lastScannedRef.current = "";
            }, 1500);
        }
    }, [selectedEventId, playBeep, vibrate]);

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
                handleScan(token);
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
    }, [isScanning, handleScan]);


    // Start camera scanning
    const startScanning = useCallback(async () => {
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

    const stopScanning = useCallback(() => {
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

    useEffect(() => {
        return () => stopScanning();
    }, [stopScanning]);

    // Manual token input
    const handleManualToken = () => {
        if (manualToken) {
            const token = manualToken.includes("/r/") ? manualToken.split("/r/")[1] : manualToken;
            handleScan(token);
            setManualToken("");
        }
    };

    // Manual search by phone/email
    const handleSearch = async () => {
        if (!selectedEventId || !searchQuery) return;

        try {
            const response = await fetch("/api/admin/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: selectedEventId,
                    search: searchQuery,
                }),
            });

            const result: CheckInResult = await response.json();
            setLastResult(result);

            if (result.success) {
                toast.success(`Checked in: ${result.registration?.studentName}`);
                setTotalCheckins(c => c + 1);
                setSearchQuery("");
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Search failed");
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 max-w-4xl mx-auto space-y-8 p-4 rounded-xl shadow-sm my-4 pb-20">
            <div className="text-center space-y-4 mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm animate-fade-in-up">
                    <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Admin Area</Badge>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900">
                    Event Entry Scanner
                </h1>
                <p className="text-gray-500 max-w-lg mx-auto text-lg">
                    Seamlessly manage event entry with high-speed QR verification.
                </p>
            </div>

            {/* Event Selection */}
            <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="h-14 bg-transparent border-0 text-lg focus:ring-0 text-gray-900">
                        <SelectValue placeholder="Select Active Event..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                        {events.map((event) => (
                            <SelectItem key={event.id} value={event.id} className="focus:bg-red-50 focus:text-red-900 cursor-pointer py-3">
                                {event.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedEventId && (
                <div className="grid md:grid-cols-2 gap-8 animate-fade-in-up delay-100">
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 text-center relative overflow-hidden group shadow-sm">
                                <div className="absolute inset-0 bg-red-500/5 blur-xl group-hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100" />
                                <div className="relative">
                                    <div className="text-4xl font-display font-bold text-red-600">{totalCheckins}</div>
                                    <div className="text-xs uppercase tracking-widest text-red-900/40 font-medium mt-1">Checked In</div>
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-gray-200 text-center flex flex-col items-center justify-center shadow-sm">
                                {lastResult?.success ? (
                                    <>
                                        <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold mb-2">Scan Successful</Badge>
                                        <div className="text-xs text-gray-500">Access Granted</div>
                                    </>
                                ) : lastResult ? (
                                    <>
                                        <Badge variant="destructive" className="font-bold mb-2">Scan Failed</Badge>
                                        <div className="text-xs text-gray-500">Access Denied</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse mb-2 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                                        <div className="text-xs text-gray-500">System Ready</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Last Scan Result Detailed */}
                        {lastResult?.registration && (
                            <div className={`p-6 rounded-2xl border shadow-sm animate-fade-in-up ${lastResult.success && !lastResult.registration.alreadyCheckedIn ? 'bg-green-50 border-green-200' : lastResult.success && lastResult.registration.alreadyCheckedIn ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                                <h3 className={`font-display text-2xl font-bold mb-1 ${lastResult.success && !lastResult.registration.alreadyCheckedIn ? 'text-green-700' : lastResult.success ? 'text-amber-700' : 'text-red-700'}`}>
                                    {lastResult.registration.studentName}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4">{lastResult.registration.email}</p>

                                <div className="space-y-2">
                                    <div className={`text-sm px-3 py-1.5 rounded-lg inline-block font-medium ${lastResult.registration.alreadyCheckedIn
                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                        }`}>
                                        {lastResult.registration.alreadyCheckedIn
                                            ? `⚠️ Previously at ${lastResult.registration.checkedInAt}`
                                            : "✅ First Check-in"}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Manual Entry */}
                        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Entry</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter QR token..."
                                        value={manualToken}
                                        onChange={(e) => setManualToken(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleManualToken()}
                                        className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 focus-visible:ring-red-500"
                                    />
                                    <Button onClick={handleManualToken} className="bg-gray-900 text-white hover:bg-black">Check In</Button>
                                </div>
                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-px bg-gray-100 flex-1" />
                                    <span className="text-xs text-gray-400 uppercase">OR SEARCH</span>
                                    <div className="h-px bg-gray-100 flex-1" />
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Email or Phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                        className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 focus-visible:ring-red-500"
                                    />
                                    <Button onClick={handleSearch} variant="secondary" className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200">Search</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Camera Scanner View - Matching University UI */}
                    <div className="relative">
                        <div className="sticky top-6">
                            <div className="relative aspect-[3/4] md:aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover bg-black"
                                    playsInline
                                    muted
                                    autoPlay
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {!isScanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 z-10">
                                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                                            <Camera className="w-10 h-10 text-white/60" />
                                        </div>
                                        <Button
                                            onClick={startScanning}
                                            size="lg"
                                            className="rounded-full px-10 py-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-xl shadow-red-500/30 transform hover:scale-105 transition-all"
                                        >
                                            <Camera className="w-5 h-5 mr-2" />
                                            Start Scanning
                                        </Button>
                                        <p className="text-white/40 text-xs mt-4">Camera stays active between scans</p>
                                    </div>
                                )}

                                {isScanning && (
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
                                            <div className="absolute top-4 left-1/2 -translate-x-1/2">
                                                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                    <span className="text-white text-xs font-medium">Scanning Active</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Stop button */}
                                        <div className="absolute bottom-4 right-4">
                                            <Button
                                                onClick={stopScanning}
                                                size="sm"
                                                variant="secondary"
                                                className="rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg text-xs px-4"
                                            >
                                                Stop
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                @keyframes scan {
                    0%, 100% { top: 8px; }
                    50% { top: calc(100% - 8px); }
                }
            `}</style>
        </div>
    );
}

export default function ScannerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
            </div>
        }>
            <ScannerContent />
        </Suspense>
    );
}

