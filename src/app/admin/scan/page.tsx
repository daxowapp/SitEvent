"use client";

import { useState, useEffect, useRef } from "react";
import { getLiveStats } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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

export default function ScannerPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [isScanning, setIsScanning] = useState(false);
    const [manualToken, setManualToken] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
    const [totalCheckins, setTotalCheckins] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const handleScan = async (token: string) => {
        if (!selectedEventId) {
            toast.error("Please select an event first");
            return;
        }

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
                    toast.warning(`Already checked in: ${result.registration.studentName}`);
                } else {
                    toast.success(`Checked in: ${result.registration?.studentName}`);
                    // Optimistic update
                    setTotalCheckins(c => c + 1);
                }
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Check-in failed");
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

    // Manual token input
    const handleManualToken = () => {
        if (manualToken) {
            handleScan(manualToken);
            setManualToken("");
        }
    };

    // Start camera scanning
    const startScanning = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsScanning(true);
                scanFrame();
            }
        } catch (error) {
            toast.error("Could not access camera");
        }
    };

    const stopScanning = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    // Scan video frame for QR codes
    const scanFrame = async () => {
        if (!videoRef.current || !canvasRef.current || !isScanning) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Try to detect QR code using BarcodeDetector API (if available)
            if ("BarcodeDetector" in window) {
                try {
                    // @ts-expect-error BarcodeDetector not in TS types
                    const barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
                    const barcodes = await barcodeDetector.detect(canvas);

                    if (barcodes.length > 0) {
                        const raw = barcodes[0].rawValue;
                        // Extract token from URL or use raw value
                        const token = raw.includes("/r/") ? raw.split("/r/")[1] : raw;
                        handleScan(token);
                        stopScanning();
                        return;
                    }
                } catch (e) {
                    // BarcodeDetector failed, continue scanning
                }
            }
        }

        // Continue scanning
        if (isScanning) {
            requestAnimationFrame(scanFrame);
        }
    };

    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, []);

    // ... (logic remains the same, only UI changes)

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-950 max-w-4xl mx-auto space-y-8 p-4 rounded-xl shadow-2xl my-4">
            <div className="text-center space-y-4 mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in-up">
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Admin Access</Badge>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                    Event Entry Scanner
                </h1>
                <p className="text-white/50 max-w-lg mx-auto text-lg">
                    Seamlessly manage event entry with high-speed QR verification.
                </p>
            </div>

            {/* Event Selection */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-xl">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="h-14 bg-transparent border-0 text-lg focus:ring-0">
                        <SelectValue placeholder="Select Active Event..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {events.map((event) => (
                            <SelectItem key={event.id} value={event.id} className="focus:bg-white/10 focus:text-white cursor-pointer py-3">
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
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all opacity-0 group-hover:opacity-100" />
                                <div className="relative">
                                    <div className="text-4xl font-display font-bold text-emerald-400">{totalCheckins}</div>
                                    <div className="text-xs uppercase tracking-widest text-emerald-200/60 font-medium mt-1">Checked In</div>
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center">
                                {lastResult?.success ? (
                                    <>
                                        <Badge className="bg-emerald-500 text-black font-bold mb-2">Scan Successful</Badge>
                                        <div className="text-xs text-white/50">Access Granted</div>
                                    </>
                                ) : lastResult ? (
                                    <>
                                        <Badge variant="destructive" className="font-bold mb-2">Scan Failed</Badge>
                                        <div className="text-xs text-white/50">Access Denied</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse mb-2 shadow-[0_0_10px_#10b981]" />
                                        <div className="text-xs text-white/50">System Ready</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Last Scan Result Detailed */}
                        {lastResult?.registration && (
                            <div className={`p-6 rounded-2xl border backdrop-blur-md animate-fade-in-up ${lastResult.success ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-red-950/30 border-red-500/30'}`}>
                                <h3 className={`font-display text-2xl font-bold mb-1 ${lastResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {lastResult.registration.studentName}
                                </h3>
                                <p className="text-white/60 text-sm mb-4">{lastResult.registration.email}</p>

                                <div className="space-y-2">
                                    <div className={`text-sm px-3 py-1.5 rounded-lg inline-block font-medium ${lastResult.registration.alreadyCheckedIn
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}>
                                        {lastResult.registration.alreadyCheckedIn
                                            ? `⚠️ Previously at ${lastResult.registration.checkedInAt}`
                                            : "✅ First Check-in"}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Manual Entry */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Manual Entry</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter QR token..."
                                        value={manualToken}
                                        onChange={(e) => setManualToken(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleManualToken()}
                                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 h-11"
                                    />
                                    <Button onClick={handleManualToken} className="bg-white text-black hover:bg-slate-200">Check In</Button>
                                </div>
                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-px bg-white/10 flex-1" />
                                    <span className="text-xs text-white/30 uppercase">OR SEARCH</span>
                                    <div className="h-px bg-white/10 flex-1" />
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Email or Phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 h-11"
                                    />
                                    <Button onClick={handleSearch} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border border-white/10">Search</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Camera Scanner View */}
                    <div className="relative">
                        <div className="sticky top-6">
                            <div className="relative aspect-[3/4] md:aspect-square bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                <video
                                    ref={videoRef}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    playsInline
                                    muted
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {!isScanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm z-10">
                                        <div className="p-4 rounded-full bg-white/5 border border-white/10 mb-4">
                                            <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-white font-medium mb-6">Camera is inactive</p>
                                        <Button onClick={startScanning} size="lg" className="rounded-full px-8 bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
                                            Start Camera
                                        </Button>
                                    </div>
                                )}

                                {isScanning && (
                                    <>
                                        {/* Scanner Overlay UI */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-0 left-0 right-0 h-1/4 bg-black/50 backdrop-blur-[2px]" />
                                            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-black/50 backdrop-blur-[2px]" />
                                            <div className="absolute top-1/4 left-0 w-8 h-1/2 bg-black/50 backdrop-blur-[2px]" />
                                            <div className="absolute top-1/4 right-0 w-8 h-1/2 bg-black/50 backdrop-blur-[2px]" />

                                            {/* Corners */}
                                            <div className="absolute top-1/4 left-8 w-12 h-12 border-l-4 border-t-4 border-emerald-500 rounded-tl-xl" />
                                            <div className="absolute top-1/4 right-8 w-12 h-12 border-r-4 border-t-4 border-emerald-500 rounded-tr-xl" />
                                            <div className="absolute bottom-1/4 left-8 w-12 h-12 border-l-4 border-b-4 border-emerald-500 rounded-bl-xl" />
                                            <div className="absolute bottom-1/4 right-8 w-12 h-12 border-r-4 border-b-4 border-emerald-500 rounded-br-xl" />

                                            {/* Scan Line */}
                                            <div className="absolute top-1/4 left-8 right-8 h-0.5 bg-emerald-400 shadow-[0_0_20px_#10b981] animate-scan-line" />
                                        </div>
                                        <Button
                                            onClick={stopScanning}
                                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 rounded-full px-6 bg-red-500/80 hover:bg-red-600 border border-red-400/50 backdrop-blur-md"
                                        >
                                            Stop Scanner
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
