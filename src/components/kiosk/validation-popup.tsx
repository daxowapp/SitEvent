"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ValidationPopupProps {
    isOpen: boolean;
    message: string | null;
    onClose: () => void;
}

export function ValidationPopup({ isOpen, message, onClose }: ValidationPopupProps) {
    const t = useTranslations("kiosk.form.validation");

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Popup Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center z-10"
                    >
                        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {t("attention")}
                        </h3>
                        
                        <p className="text-xl text-gray-600 mb-8 font-medium">
                            {message || t("defaultError")}
                        </p>

                        <Button 
                            onClick={onClose}
                            className="w-full h-16 text-xl rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                        >
                            {t("fixIt")}
                        </Button>
                        
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
