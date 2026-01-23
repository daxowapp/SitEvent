"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface QrCodeDisplayProps {
    token: string;
    width?: number;
    className?: string;
}

export function QrCodeDisplay({ token, width = 224, className }: QrCodeDisplayProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function generateQr() {
            try {
                const response = await fetch(`/api/qr/${token}`);
                if (response.ok) {
                    const data = await response.json();
                    setQrDataUrl(data.qrDataUrl);
                }
            } catch (error) {
                console.error("Failed to generate QR code:", error);
            } finally {
                setLoading(false);
            }
        }

        generateQr();
    }, [token]);

    const downloadQr = () => {
        if (!qrDataUrl) return;

        const link = document.createElement("a");
        link.href = qrDataUrl;
        link.download = `event-qr-${token}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div
                className={`flex items-center justify-center rounded-lg border-2 border-dashed ${className}`}
                style={{ width, height: width }}
            >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    if (!qrDataUrl) {
        return (
            <div
                className={`flex items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground ${className}`}
                style={{ width, height: width }}
            >
                Failed to load QR code
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border-4 border-white bg-white p-4 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className={className}
                    style={{ width, height: width }}
                />
            </div>
            <Button onClick={downloadQr} variant="outline" size="sm">
                📥 Download QR Code
            </Button>
        </div>
    );
}

