"use client";

import { useState, useEffect, useRef } from "react";
import { AttractScreen } from "./attract-screen";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, FileSearch, CheckCircle2 } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { RegistrationForm } from "./registration-form";
import { TicketRecovery } from "./ticket-recovery";
import { useTranslations } from "next-intl";
import Image from "next/image";

type KioskState = "idle" | "menu" | "register" | "recover" | "success";

interface KioskShellProps {
    event: any;
    locale: string;
}

export function KioskShell({ event, locale }: KioskShellProps) {
    const t = useTranslations("kiosk");
    const [state, setState] = useState<KioskState>("idle");
    const [successToken, setSuccessToken] = useState<string | null>(null);
    const [isDuplicate, setIsDuplicate] = useState(false); 
    const [lastInteraction, setLastInteraction] = useState<number>(() => Date.now());
    const interactionTimeout = useRef<NodeJS.Timeout | null>(null);

    // Auto-reset on inactivity
    useEffect(() => {
        const resetTime = state === "success" ? 10000 : 60000;
        
        if (state === "idle") return;

        const handleInteraction = () => setLastInteraction(Date.now());
        window.addEventListener("click", handleInteraction);
        window.addEventListener("touchstart", handleInteraction);

        interactionTimeout.current = setInterval(() => {
            if (Date.now() - lastInteraction > resetTime) {
                setState("idle");
                setTimeout(() => {
                    setSuccessToken(null);
                    setIsDuplicate(false);
                }, 500);
            }
        }, 1000);

        return () => {
            if (interactionTimeout.current) clearInterval(interactionTimeout.current);
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("touchstart", handleInteraction);
        };
    }, [state, lastInteraction]);

    const transitionTo = (newState: KioskState) => {
        setLastInteraction(Date.now());
        setState(newState);
        if (newState === "idle") {
             setTimeout(() => {
                setSuccessToken(null);
                setIsDuplicate(false);
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden font-sans" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gray-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50 pointer-events-none" />

            <AnimatePresence mode="wait">
                {state === "idle" && (
                    <motion.div 
                        key="attract"
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="absolute inset-0 z-50"
                    >
                        <AttractScreen eventName={event.title} onStart={() => transitionTo("menu")} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`transition-opacity duration-500 ${state === "idle" ? "opacity-0" : "opacity-100"}`}>
                {/* Header */}
                <header className="p-8 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        {state !== "menu" && state !== "success" && (
                            <Button 
                                variant="ghost" 
                                size="lg" 
                                className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl"
                                onClick={() => transitionTo("menu")}
                            >
                                <ArrowLeft className={`w-6 h-6 ${locale === 'ar' ? 'ml-2 rotate-180' : 'mr-2'}`} /> 
                                {t("menu.back")}
                            </Button>
                        )}
                        <div className="flex items-center gap-4">
                             {/* Logo in Header */}
                            <div className="relative w-12 h-12">
                                <Image 
                                    src="/logo-red.svg" 
                                    alt="Sit Connect" 
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="h-8 w-px bg-gray-200" />
                            <h2 className="text-2xl font-bold text-gray-900">
                                {event.title}
                            </h2>
                        </div>
                    </div>
                </header>

                <main className="p-8 max-w-5xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-center">
                    {state === "menu" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <MenuOption 
                                icon={<UserPlus className="w-16 h-16" />}
                                title={t("menu.newRegistration")}
                                description={t("menu.newRegistrationDesc")}
                                onClick={() => transitionTo("register")}
                                primary
                            />
                            <MenuOption 
                                icon={<FileSearch className="w-16 h-16" />}
                                title={t("menu.lostTicket")}
                                description={t("menu.lostTicketDesc")}
                                onClick={() => transitionTo("recover")}
                            />
                        </div>
                    )}

                    {state === "register" && (
                        <RegistrationForm 
                            eventId={event.id} 
                            locale={locale}
                            eventLocation={{ country: event.cityRef?.country.name, city: event.cityRef?.name }}
                            onSuccess={(token, duplicate) => {
                                setSuccessToken(token);
                                setIsDuplicate(!!duplicate);
                                transitionTo("success");
                            }}
                        />
                    )}

                    {state === "recover" && (
                        <TicketRecovery 
                            eventId={event.id} 
                            onSuccess={(token) => {
                                setSuccessToken(token || null);
                                setIsDuplicate(false);
                                transitionTo("success");
                            }} 
                        />
                    )}

                    {state === "success" && (
                        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                           <div className="p-6 bg-white rounded-3xl shadow-xl border border-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(successToken || "")}`} 
                                    alt="Your Entry QR" 
                                    className="w-64 h-64 md:w-80 md:h-80"
                                />
                           </div>
                           
                           <div>
                               <div className="flex items-center justify-center gap-3 mb-4">
                                   {isDuplicate ? (
                                       <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-lg font-medium">✨ {t("success.welcomeBack")}</span>
                                   ) : (
                                       <CheckCircle2 className="w-12 h-12 text-green-500" />
                                   )}
                               </div>
                               <h1 className="text-5xl font-bold mb-4 text-gray-900">
                                   {isDuplicate ? t("success.welcomeBack") : t("success.title")}
                               </h1>
                               <p className="text-2xl text-gray-500 max-w-xl mx-auto">
                                   {isDuplicate 
                                       ? t("success.existingTicket") 
                                       : t("success.subtitle")}
                               </p>
                           </div>
                           
                           <div className="pt-8 w-full max-w-md">
                               <Button 
                                   size="lg" 
                                   className="w-full bg-red-600 text-white hover:bg-red-700 text-2xl h-24 rounded-2xl shadow-xl shadow-red-200"
                                   onClick={() => transitionTo("idle")}
                               >
                                   {t("success.doneNext")}
                               </Button>
                               <p className="mt-6 text-gray-400">{t("success.resetting")}</p>
                           </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function MenuOption({ icon, title, description, onClick, primary }: any) {
    return (
        <button
            onClick={onClick}
            className={`group relative p-12 rounded-3xl border-2 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-xl
                ${primary 
                    ? "bg-red-600 border-red-600 text-white shadow-red-200" 
                    : "bg-white border-gray-100 text-gray-900 hover:border-red-100 hover:bg-red-50/50"
                }
            `}
        >
            <div className={`mb-6 transition-opacity ${primary ? "text-white opacity-90" : "text-red-600 opacity-100"}`}>
                {icon}
            </div>
            <h3 className="text-4xl font-bold mb-2">{title}</h3>
            <p className={`text-xl font-medium ${primary ? "text-red-100" : "text-gray-500"}`}>
                {description}
            </p>
        </button>
    );
}
