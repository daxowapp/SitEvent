"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { scanLead } from "./actions"; // We'll create this next
import { QrCode, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface ScanResult {
    success: boolean;
    message: string;
    lead?: {
        name: string;
        email: string;
        phone: string;
        academicInterest?: string;
    };
}

export default function LeadScannerPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
    const [manualToken, setManualToken] = useState("");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- (Reuse Scanner Logic from Admin - In a real app we'd abstract this hook) ---
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

    const scanFrame = async () => {
        if (!videoRef.current || !canvasRef.current || !isScanning) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if ("BarcodeDetector" in window) {
                try {
                    // @ts-expect-error BarcodeDetector
                    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
                    const barcodes = await detector.detect(canvas);
                    if (barcodes.length > 0) {
                        const raw = barcodes[0].rawValue;
                        const token = raw.includes("/r/") ? raw.split("/r/")[1] : raw;
                        handleScan(token);
                        // Optional: Keep scanning or stop? Usually stop to show result for a moment.
                        stopScanning();
                        return;
                    }
                } catch { }
            }
        }
        if (isScanning) requestAnimationFrame(scanFrame);
    };

    useEffect(() => {
        return () => stopScanning();
    }, []);
    // -------------------------------------------------------------------------------

    const handleScan = async (token: string) => {
        const promise = scanLead(token);

        toast.promise(promise, {
            loading: 'Verifying student info...',
            success: (data) => {
                if (!data.success) throw new Error(data.message);
                setLastResult(data);
                setScanHistory(prev => [data, ...prev]);
                return `Lead Captured: ${data.lead?.name}`;
            },
            error: (err) => {
                setLastResult({ success: false, message: err.message });
                return err.message;
            }
        });
    };

    const handleManualSubmit = () => {
        if (manualToken) {
            handleScan(manualToken);
            setManualToken("");
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="font-display text-4xl font-bold text-white mb-2">Lead Scanner</h1>
                    <p className="text-white/50">Capture student information instantly by scanning their Event QR Code.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Real-time Sync Active</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column: Scanner */}
                <div className="space-y-6">
                    <div className="relative aspect-square bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            playsInline
                            muted
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {!isScanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 transition-all">
                                <QrCode className="w-16 h-16 text-white/20 mb-6" />
                                <Button onClick={startScanning} size="lg" className="rounded-full px-8 bg-white text-black hover:bg-emerald-400 font-bold transition-all transform hover:scale-105">
                                    Activate Camera
                                </Button>
                            </div>
                        )}

                        {isScanning && (
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Scan Animation */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_50px_#10b981] animate-scan-line-vertical opacity-80" />
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
                                    <Button onClick={stopScanning} variant="destructive" className="rounded-full">Stop Scanning</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                        <label className="text-sm text-white/50 mb-2 block">Manual Entry</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter QR Token..."
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                className="bg-black/20 border-white/10 text-white"
                            />
                            <Button onClick={handleManualSubmit}>Submit</Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="space-y-6">
                    {lastResult && (
                        <div className={`p-8 rounded-3xl border animate-fade-in-up ${lastResult.success ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lastResult.success ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                                    {lastResult.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="font-display text-2xl font-bold text-white">
                                        {lastResult.success ? 'Lead Captured!' : 'Scan Failed'}
                                    </h3>
                                    <p className="text-white/50 text-sm">{lastResult.message}</p>
                                </div>
                            </div>

                            {lastResult.lead && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/30 mb-1">Student Name</div>
                                        <div className="text-xl font-medium text-white">{lastResult.lead.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/30 mb-1">Contact</div>
                                        <div className="text-white/80">{lastResult.lead.email}</div>
                                        <div className="text-white/80">{lastResult.lead.phone}</div>
                                    </div>
                                    {lastResult.lead.academicInterest && (
                                        <div>
                                            <div className="text-xs uppercase tracking-widest text-white/30 mb-1">Interest</div>
                                            <Badge variant="outline" className="border-white/20 text-white/70">
                                                {lastResult.lead.academicInterest}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-[400px] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-white mb-4 sticky top-0 bg-[#0F172A] pb-2 z-10 border-b border-white/5">Session History</h3>
                        <div className="space-y-3">
                            {scanHistory.map((scan, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${scan.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        <div>
                                            <div className="text-sm font-medium text-white">{scan.lead?.name || "Unknown"}</div>
                                            <div className="text-xs text-white/40">{scan.lead?.email || "No Data"}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-white/30 font-mono">
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                            {scanHistory.length === 0 && (
                                <div className="text-center py-10 text-white/20">
                                    <QrCode className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    No leads scanned in this session
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
