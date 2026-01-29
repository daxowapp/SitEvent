"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function AdminError({
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
            console.error("Admin Error:", error.digest);
        }
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Something went wrong
                    </h1>
                    <p className="text-gray-600">
                        An error occurred while loading this page. Please try again or contact support if the problem persists.
                    </p>
                    {error.digest && (
                        <p className="text-xs text-gray-400 font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex gap-3 justify-center">
                    <Button onClick={reset} variant="default" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/admin">
                            <Home className="w-4 h-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
