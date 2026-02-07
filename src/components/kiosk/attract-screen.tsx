"use client";

import { motion } from "framer-motion";
import { TouchpadOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface AttractScreenProps {
    eventName: string;
    onStart: () => void;
}

export function AttractScreen({ eventName, onStart }: AttractScreenProps) {
    const t = useTranslations("kiosk.attract");

    return (
        <div 
            className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white via-red-50 to-white relative overflow-hidden cursor-pointer"
            onClick={onStart}
        >
            {/* Animated Background Elements */}
            <motion.div 
                className="absolute inset-0 opacity-10"
                animate={{ 
                    backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
                }}
                style={{
                    backgroundImage: "radial-gradient(circle, #dc2626 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />
            
            {/* Decorative Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-red-200 rounded-full blur-[100px] opacity-20 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-200 rounded-full blur-[100px] opacity-20 translate-x-1/2 translate-y-1/2" />

            <div className="z-10 text-center space-y-12 max-w-5xl px-8 flex flex-col items-center">
                {/* LOGO ANIMATION */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-8"
                >
                    <div className="relative w-64 h-24 md:w-80 md:h-32">
                        <Image 
                            src="/logo-red.svg" 
                            alt="Sit Connect Logo" 
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-red-100 text-red-600 font-semibold tracking-wide text-sm uppercase mb-4">
                        {t("welcomeTo")}
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-tight">
                        {eventName}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-500 font-medium tracking-widest uppercase">
                        {t("officialKiosk")}
                    </p>
                </motion.div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="w-28 h-28 rounded-full bg-red-600 flex items-center justify-center shadow-[0_10px_40px_rgba(220,38,38,0.4)] transition-transform hover:scale-105 group">
                        <TouchpadOff className="w-12 h-12 text-white group-hover:animate-pulse" />
                    </div>
                    <p className="text-2xl font-light text-gray-600">{t("tapToStart")}</p>
                </motion.div>
            </div>
            
            <div className="absolute bottom-12 text-gray-400 text-sm font-medium tracking-wide">
                {t("footer")}
            </div>
        </div>
    );
}
