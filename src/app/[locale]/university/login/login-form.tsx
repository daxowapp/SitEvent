"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn("university-credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Invalid credentials");
                setIsLoading(false);
            } else {
                toast.success("Login successful! Redirecting...");
                // Force a hard refresh/navigation to ensure session is picked up
                window.location.href = "/university/dashboard";
            }
        } catch {
            toast.error("Something went wrong");
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative isolate overflow-hidden font-sans text-slate-900">
            {/* Background Effects - Red/White Theme */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-50 via-white to-white" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-100/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-50/50 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-lg p-8 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center"
                >
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-32 h-32 mx-auto mb-8 bg-white rounded-3xl shadow-xl shadow-red-100 flex items-center justify-center p-6 border border-red-50"
                    >
                        <Image 
                            src="/logo-red.svg" 
                            alt="Sit Connect Logo" 
                            width={128} 
                            height={128} 
                            className="w-full h-full object-contain"
                        />
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 mb-6"
                    >
                        <Sparkles className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-bold tracking-wide text-red-700 uppercase">
                            University Portal
                        </span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="font-display text-4xl font-bold mb-3 tracking-tight text-slate-900"
                    >
                        Welcome Back
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-slate-500"
                    >
                        Manage your events and access student data
                    </motion.p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-red-100/50"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-medium">University Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="uni@university.edu"
                                required
                                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500/50 focus:ring-red-500/20 h-12 rounded-xl transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                <a href="#" className="text-xs text-red-600 hover:text-red-700 font-medium">Forgot password?</a>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-slate-50 border-slate-200 text-slate-900 focus:border-red-500/50 focus:ring-red-500/20 h-12 rounded-xl transition-all"
                            />
                        </div>

                        <Button
                            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-200 transition-all duration-300 transform hover:scale-[1.02]"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Accessing Portal...
                                </>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </form>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 text-center"
                >
                    <p className="text-slate-500 text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/recruit" className="text-red-600 font-bold hover:underline">
                            Apply for Partnership
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
