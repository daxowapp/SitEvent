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
import { Html5Qrcode } from "html5-qrcode";

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
    const scannerRef = useRef<Html5Qrcode | null>(null);

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
        if (scannerRef.current) return; // Already running logic check

        try {
            const scanner = new Html5Qrcode("reader");
            scannerRef.current = scanner;
            setIsScanning(true);

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // Success callback
                    const token = decodedText.includes("/r/") ? decodedText.split("/r/")[1] : decodedText;
                    handleScan(token);
                    stopScanning();
                },
                (errorMessage) => {
                    // Parse error, ignore
                }
            );
        } catch (error) {
            console.error(error);
            toast.error("Could not start camera. Please ensure permissions are granted.");
            setIsScanning(false);
            if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                scannerRef.current = null;
            } catch (error) {
                console.warn("Failed to stop scanner", error);
            }
        }
        setIsScanning(false);
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
                scannerRef.current.clear();
            }
        };
    }, []);

    // ... (logic remains the same, only UI changes)

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 max-w-4xl mx-auto space-y-8 p-4 rounded-xl shadow-sm my-4">
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
                                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mb-2 shadow-[0_0_10px_#ef4444]" />
                                        <div className="text-xs text-gray-500">System Ready</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Last Scan Result Detailed */}
                        {lastResult?.registration && (
                            <div className={`p-6 rounded-2xl border shadow-sm animate-fade-in-up ${lastResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <h3 className={`font-display text-2xl font-bold mb-1 ${lastResult.success ? 'text-green-700' : 'text-red-700'}`}>
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

                    {/* Camera Scanner View */}
                    <div className="relative">
                        <div className="sticky top-6">
                            <div className="relative aspect-[3/4] md:aspect-square bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 shadow-2xl">
                                <div id="reader" className="w-full h-full bg-black" />

                                {!isScanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-sm z-10">
                                        <div className="p-4 rounded-full bg-white border border-gray-200 mb-4 shadow-sm">
                                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-900 font-medium mb-6">Camera is inactive</p>
                                        <Button onClick={startScanning} size="lg" className="rounded-full px-8 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20">
                                            Start Camera
                                        </Button>
                                    </div>
                                )}

                                {isScanning && (
                                    <>
                                        {/* Scanner Overlay UI */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-0 left-0 right-0 h-1/4 bg-black/50 backdrop-blur-[1px]" />
                                            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-black/50 backdrop-blur-[1px]" />
                                            <div className="absolute top-1/4 left-0 w-8 h-1/2 bg-black/50 backdrop-blur-[1px]" />
                                            <div className="absolute top-1/4 right-0 w-8 h-1/2 bg-black/50 backdrop-blur-[1px]" />

                                            {/* Corners - White/Red Theme */}
                                            <div className="absolute top-1/4 left-8 w-12 h-12 border-l-4 border-t-4 border-red-500 rounded-tl-xl" />
                                            <div className="absolute top-1/4 right-8 w-12 h-12 border-r-4 border-t-4 border-red-500 rounded-tr-xl" />
                                            <div className="absolute bottom-1/4 left-8 w-12 h-12 border-l-4 border-b-4 border-red-500 rounded-bl-xl" />
                                            <div className="absolute bottom-1/4 right-8 w-12 h-12 border-r-4 border-b-4 border-red-500 rounded-br-xl" />

                                            {/* Scan Line */}
                                            <div className="absolute top-1/4 left-8 right-8 h-0.5 bg-red-500 shadow-[0_0_20px_#ef4444] animate-scan-line" />
                                        </div>
                                        <Button
                                            onClick={stopScanning}
                                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 rounded-full px-6 bg-white/90 hover:bg-white text-red-600 border border-white/50 backdrop-blur-md shadow-xl"
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
