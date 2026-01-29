"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function LocaleError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to monitoring service in production
        if (process.env.NODE_ENV === "production") {
            // TODO: Send to Sentry or similar
            console.error("Page Error:", error.digest);
        }
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Oops! Something went wrong
                    </h1>
                    <p className="text-gray-600 text-lg">
                        We&apos;re sorry, but something unexpected happened. Please try again.
                    </p>
                    {error.digest && (
                        <p className="text-xs text-gray-400 font-mono mt-4">
                            Reference: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex gap-4 justify-center pt-4">
                    <Button onClick={reset} size="lg" className="gap-2">
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </Button>
                    <Button asChild variant="outline" size="lg" className="gap-2">
                        <Link href="/">
                            <Home className="w-5 h-5" />
                            Go Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
