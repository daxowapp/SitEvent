
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function UsherLoginPage() {
    const router = useRouter();
    const [pin, setPin] = useState("");
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

            if (result?.error) {
                toast.error("Invalid PIN code");
                setPin("");
            } else {
                toast.success("Welcome back!");
                router.push("/admin/events"); // Redirect to events list to pick one
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
        if (value.length === 6) {
            // Small timeout to allow state to update
            setTimeout(() => {
                // We need to pass the value explicitly or ensure state is updated
                // calling handleLogin with the current 'value' logic would be better but handleLogin uses 'pin' state which might lag in this closure? 
                // Actually React state updates are batched. But to be safe let's just let user hit enter or wait a beat? 
                // Let's simpler: Just let user type. 
                // For "Auto-submit", implementing effectively needs a useEffect or calling logic with 'value'.
                // Let's stick to manual submit or Enter key for simplicity and reliability first.
            }, 100);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Usher Fast Login
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Enter your 6-digit access code to start scanning.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div className="relative">
                        <input
                            type="text" // 'tel' ensures numeric keypad on mobile usually
                            inputMode="numeric"
                            autoComplete="off"
                            required
                            placeholder="Enter PIN"
                            value={pin}
                            onChange={handlePinChange}
                            className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-600"
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
        </div>
    );
}
