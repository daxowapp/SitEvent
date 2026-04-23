"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Search,
    FileCheck,
    Shield,
    Calendar,
    User,
    Hash,
    Loader2,
} from "lucide-react";

interface VerificationResult {
    valid: boolean;
    reason?: string;
    subject?: string;
    recipientName?: string;
    senderName?: string;
    senderTitle?: string;
    issuedAt?: string;
    referenceNumber?: string;
    expiresAt?: string;
}

function VerifyPageContent() {
    const searchParams = useSearchParams();
    const tokenFromUrl = searchParams.get("token");
    const refFromUrl = searchParams.get("ref");

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [manualRef, setManualRef] = useState("");
    const [hasQueried, setHasQueried] = useState(false);

    useEffect(() => {
        if (tokenFromUrl || refFromUrl) {
            verify(tokenFromUrl, refFromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenFromUrl, refFromUrl]);

    const verify = async (
        token: string | null,
        ref: string | null
    ) => {
        setLoading(true);
        setResult(null);
        setHasQueried(true);
        try {
            const params = new URLSearchParams();
            if (token) params.set("token", token);
            if (ref) params.set("ref", ref);

            const res = await fetch(
                `/api/documents/verify?${params.toString()}`
            );
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({
                valid: false,
                reason: "Unable to verify. Please try again later.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualRef.trim()) {
            verify(null, manualRef.trim());
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">
                            Document Verification
                        </h1>
                        <p className="text-xs text-slate-500">
                            Verify the authenticity of official documents
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg space-y-6">
                    {/* Result Section */}
                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 text-center"
                            >
                                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
                                <p className="text-slate-600 font-medium">
                                    Verifying document...
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Checking our records
                                </p>
                            </motion.div>
                        )}

                        {!loading && result && result.valid && (
                            <motion.div
                                key="valid"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <div className="bg-white rounded-2xl shadow-xl shadow-emerald-100/50 border-2 border-emerald-200 overflow-hidden">
                                    {/* Status Header */}
                                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-5 text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                <CheckCircle className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">
                                                    Document Verified
                                                </h2>
                                                <p className="text-emerald-100 text-sm">
                                                    This document is authentic
                                                    and valid
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Document Details */}
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-4">
                                            {/* Subject */}
                                            <div className="bg-slate-50 rounded-xl p-4">
                                                <div className="flex items-start gap-3">
                                                    <FileCheck className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                            Subject
                                                        </p>
                                                        <p className="text-lg font-semibold text-slate-900 mt-0.5">
                                                            {result.subject}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {result.referenceNumber && (
                                                    <div className="bg-slate-50 rounded-xl p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                                Reference
                                                            </p>
                                                        </div>
                                                        <p className="font-mono font-semibold text-slate-900 text-sm">
                                                            {
                                                                result.referenceNumber
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                {result.issuedAt && (
                                                    <div className="bg-slate-50 rounded-xl p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                                Issued
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold text-slate-900 text-sm">
                                                            {format(
                                                                new Date(
                                                                    result.issuedAt
                                                                ),
                                                                "PPP"
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                                {result.senderName && (
                                                    <div className="bg-slate-50 rounded-xl p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                                Signed By
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold text-slate-900 text-sm">
                                                            {result.senderName}
                                                        </p>
                                                        {result.senderTitle && (
                                                            <p className="text-xs text-slate-500">
                                                                {
                                                                    result.senderTitle
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {result.recipientName && (
                                                    <div className="bg-slate-50 rounded-xl p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                                Recipient
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold text-slate-900 text-sm">
                                                            {
                                                                result.recipientName
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!loading && result && !result.valid && (
                            <motion.div
                                key="invalid"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <div className="bg-white rounded-2xl shadow-xl shadow-red-100/50 border-2 border-red-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-5 text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                {result.reason?.includes(
                                                    "expired"
                                                ) ? (
                                                    <AlertTriangle className="h-7 w-7" />
                                                ) : (
                                                    <XCircle className="h-7 w-7" />
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">
                                                    {result.reason?.includes(
                                                        "revoked"
                                                    )
                                                        ? "Document Revoked"
                                                        : result.reason?.includes(
                                                              "expired"
                                                          )
                                                        ? "Document Expired"
                                                        : "Verification Failed"}
                                                </h2>
                                                <p className="text-red-100 text-sm">
                                                    {result.reason}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {(result.subject ||
                                        result.referenceNumber) && (
                                        <div className="p-6 space-y-3">
                                            {result.subject && (
                                                <div className="bg-red-50 rounded-xl p-4">
                                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                                                        Subject
                                                    </p>
                                                    <p className="font-semibold text-slate-900">
                                                        {result.subject}
                                                    </p>
                                                </div>
                                            )}
                                            {result.referenceNumber && (
                                                <p className="text-sm text-slate-500">
                                                    Reference:{" "}
                                                    <span className="font-mono font-semibold">
                                                        {
                                                            result.referenceNumber
                                                        }
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Manual Search */}
                    {!loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: hasQueried ? 0.3 : 0 }}
                        >
                            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
                                <div className="text-center mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                                        <Search className="h-6 w-6 text-indigo-500" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900">
                                        Manual Verification
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Enter the reference number from the
                                        document to verify
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleManualSearch}
                                    className="flex gap-2"
                                >
                                    <input
                                        type="text"
                                        placeholder="e.g. LTR-2026-0001"
                                        value={manualRef}
                                        onChange={(e) =>
                                            setManualRef(e.target.value)
                                        }
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!manualRef.trim()}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Verify
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* Trust Footer */}
                    <div className="text-center text-xs text-slate-400 space-y-1">
                        <p className="flex items-center justify-center gap-1.5">
                            <Shield className="h-3.5 w-3.5" />
                            Secured by SitConnect Document Validation System
                        </p>
                        <p>
                            If you have concerns about a document, please
                            contact us directly.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                </div>
            }
        >
            <VerifyPageContent />
        </Suspense>
    );
}
