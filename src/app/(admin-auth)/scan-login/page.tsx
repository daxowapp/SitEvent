
"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

function UsherLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/admin/scan";
    const [pin, setPin] = useState("");
    const [station, setStation] = useState<"USHER" | "HELPDESK">("USHER");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!pin || pin.length < 4) {
            toast.error("Please enter a valid PIN");
            return;
        }

        setLoading(true);

        try {
            const result = await signIn("usher-pin", {
                accessCode: pin,
                redirect: false,
            });

            const finalUrl = searchParams.get("callbackUrl") || (station === "HELPDESK" ? "/admin/helpdesk" : "/admin/scan");

            if (result?.error) {
                toast.error("Invalid PIN code");
                setPin("");
            } else {
                toast.success(`Welcome to ${station === "HELPDESK" ? "Help Desk" : "Check-in"}!`);
                router.push(finalUrl); 
                router.refresh();
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit when 6 digits are entered
    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, ""); // Num only
        setPin(value);
    };

    return (
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Staff PIN Login
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Select your station and enter your access PIN.
                </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-6">
                
                {/* Station Selection */}
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setStation("USHER")}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${station === "USHER" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Check-In Station
                    </button>
                    <button
                        type="button"
                        onClick={() => setStation("HELPDESK")}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${station === "HELPDESK" ? "bg-white shadow-sm text-purple-700" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Red Points Help Desk
                    </button>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        required
                        placeholder="Enter PIN"
                        value={pin}
                        onChange={handlePinChange}
                        className={`block w-full rounded-xl border-2 px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] transition-colors focus:outline-none focus:ring-0 ${station === "HELPDESK" ? 'border-purple-100 bg-purple-50 text-purple-900 focus:border-purple-500' : 'border-blue-100 bg-blue-50 text-blue-900 focus:border-blue-500'}`}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || pin.length < 4}
                    className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-blue-500"
                >
                    {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <>
                            Start Scanning <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </button>
            </form>

            <div className="text-center mt-6">
                <Link
                    href="/admin/login"
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                    ← Back to Admin Login
                </Link>
            </div>
        </div>
    );
}

export default function UsherLoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            }>
                <UsherLoginForm />
            </Suspense>
        </div>
    );
}
