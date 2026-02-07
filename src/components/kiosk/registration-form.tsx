"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { recoverTicketKiosk } from "@/app/actions/kiosk";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ValidationPopup } from "./validation-popup";

interface RegistrationFormProps {
    eventId: string;
    locale: string;
    eventLocation?: { country: string; city: string };
    onSuccess: (token: string, isDuplicate?: boolean) => void;
}

export function RegistrationForm({ eventId, locale, eventLocation, onSuccess }: RegistrationFormProps) {
    const t = useTranslations("kiosk.form");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Schema validation
    const step0Schema = z.object({
        fullName: z.string().min(2, t("validation.nameRequired")),
    });

    const step1Schema = z.object({
        email: z.string().email(t("validation.emailInvalid")),
        phone: z.string().min(8, t("validation.phoneRequired")), // Length validation for Egyptian numbers usually 10-11 digits, but let's be lenient
    });

    const step2Schema = z.object({
        levelOfStudy: z.string().min(1, t("validation.levelRequired")),
        interestedMajor: z.string().optional(),
    });

    // Combined schema for final submit
    const kioskSchema = step0Schema.merge(step1Schema).merge(step2Schema).extend({
        country: z.string().min(1),
        city: z.string().min(1),
        consent: z.boolean(),
    });

    type KioskFormValues = z.infer<typeof kioskSchema>;

    const form = useForm<KioskFormValues>({
        resolver: zodResolver(kioskSchema),
        defaultValues: {
            country: eventLocation?.country || "Egypt", // Defaulting to Egypt for this kiosk
            city: eventLocation?.city || "Cairo",
            consent: true,
            fullName: "",
            email: "",
            phone: "",
            levelOfStudy: "",
            interestedMajor: ""
        },
        mode: "onChange"
    });

    const nextStep = async () => {
        let valid = false;
        if (step === 0) valid = await form.trigger(["fullName"]);
        if (step === 1) valid = await form.trigger(["email", "phone"]);
        
        if (valid) {
             setStep((s) => s + 1);
        } else {
            // Get the first error message to display in popup
            const errors = form.formState.errors;
            const firstErrorField = Object.keys(errors)[0] as keyof KioskFormValues;
            if (firstErrorField && errors[firstErrorField]) {
                 setValidationError(errors[firstErrorField]?.message || t("validation.checkForm"));
            }
        }
    };

    const prevStep = () => setStep((s) => s - 1);

    async function onSubmit(values: KioskFormValues) {
        setLoading(true);
        // Format phone with prefix if needed, for now sending as is but assuming user enters 01xxxx
        const formattedPhone = values.phone.startsWith("+") ? values.phone : `+20${values.phone.replace(/^0+/, "")}`;

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    phone: formattedPhone,
                    eventId,
                    locale,
                    nationality: values.country,
                    utmSource: "kiosk",
                    utmMedium: "offline",
                    utmCampaign: "onsite"
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409 || data.error?.includes("already registered")) {
                    toast.info(t("alreadyRegistered"));
                    const recovery = await recoverTicketKiosk(values.email, eventId);
                    if (recovery.success && recovery.qrToken) {
                         onSuccess(recovery.qrToken, true);
                         return;
                    }
                }
                throw new Error(data.error || "Registration failed");
            }

            toast.success(t("success"));
            onSuccess(data.qrToken, false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    const levels = ["HIGH_SCHOOL", "BACHELOR", "MASTER", "PHD"];
    const majors = ["MEDICINE", "ENGINEERING", "BUSINESS", "CS", "LANGUAGES", "OTHER"];

    return (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl min-h-[500px] flex flex-col">
            {/* Progress Bar */}
            <div className="flex justify-between mb-8 px-2">
                {[0, 1, 2].map((s) => (
                    <div key={s} className={`h-2 rounded-full flex-1 mx-1 transition-all duration-300 ${s <= step ? "bg-red-600" : "bg-gray-100"}`} />
                ))}
            </div>

            {/* Validation Popup */}
            <ValidationPopup 
                isOpen={!!validationError} 
                message={validationError} 
                onClose={() => setValidationError(null)} 
            />

            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
                {step === 0 && t("steps.personal")}
                {step === 1 && t("steps.contact")}
                {step === 2 && t("steps.education")}
            </h2>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6 flex-1"
                        >
                            {/* STEP 0: FULL NAME */}
                            {step === 0 && (
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xl font-semibold text-gray-700">{t("fullName")}</FormLabel>
                                            <FormControl>
                                                {/* Force LTR for name entry if usually English */}
                                                <Input 
                                                    dir="ltr" 
                                                    autoFocus 
                                                    placeholder={t("validation.namePlaceholder")} 
                                                    className="h-20 text-2xl bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500 focus:ring-red-200" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-lg" />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* STEP 1: EMAIL & PHONE */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xl font-semibold text-gray-700">{t("email")}</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="email" 
                                                        dir="ltr"
                                                        placeholder={t("emailPlaceholder")}
                                                        className="h-20 text-xl bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500 focus:ring-red-200" 
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xl font-semibold text-gray-700">{t("phone")}</FormLabel>
                                                <FormControl>
                                                    <div className="flex direction-ltr" dir="ltr">
                                                        <span className="flex items-center justify-center bg-gray-100 border border-r-0 border-gray-200 rounded-l-md px-4 text-xl text-gray-600 font-mono">
                                                            +20
                                                        </span>
                                                        <Input 
                                                            type="tel" 
                                                            dir="ltr"
                                                            placeholder="10xxxxxxxxx" 
                                                            className="h-20 text-xl bg-gray-50 border-gray-200 text-gray-900 rounded-l-none focus:border-red-500 focus:ring-red-200 font-mono tracking-widest" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {/* STEP 2: EDUCATION & MAJOR */}
                            {step === 2 && (
                                <div className="space-y-8">
                                    <FormField
                                        control={form.control}
                                        name="levelOfStudy"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xl font-semibold text-gray-700 mb-4 block">{t("levelOfStudy")}</FormLabel>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {levels.map((level) => (
                                                        <button
                                                            key={level}
                                                            type="button"
                                                            onClick={() => field.onChange(level)}
                                                            className={`p-4 rounded-xl border-2 text-lg font-medium transition-all
                                                                ${field.value === level 
                                                                    ? "border-red-600 bg-red-50 text-red-700 shadow-sm" 
                                                                    : "border-gray-200 bg-white text-gray-600 hover:border-red-200"
                                                                }
                                                            `}
                                                        >
                                                            {t(`levels.${level}`)}
                                                        </button>
                                                    ))}
                                                </div>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="interestedMajor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xl font-semibold text-gray-700 mb-4 block">{t("interestedMajor")}</FormLabel>
                                                 <div className="flex flex-wrap gap-3">
                                                    {majors.map((major) => (
                                                         <button
                                                            key={major}
                                                            type="button"
                                                            onClick={() => {
                                                                if (major === "OTHER") {
                                                                    field.onChange(""); // clear for input
                                                                } else {
                                                                    field.onChange(t(`majors.${major}`));
                                                                }
                                                            }}
                                                            className={`px-6 py-3 rounded-full border text-lg transition-all
                                                                ${(field.value === t(`majors.${major}`) && major !== "OTHER")
                                                                    ? "bg-gray-900 text-white border-gray-900" 
                                                                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                                                }
                                                            `}
                                                        >
                                                            {t(`majors.${major}`)}
                                                        </button>
                                                    ))}
                                                </div>
                                                {/* Show text input if "Others" is selected or user wants to type specifically (implied by Others logic) */}
                                                <div className="mt-4">
                                                    <Input 
                                                        placeholder={t("majorPlaceholder")} 
                                                        value={field.value} 
                                                        onChange={field.onChange}
                                                        className="h-16 text-xl bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500 focus:ring-red-200"
                                                    />
                                                </div>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                        {step > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                className="h-16 px-8 text-xl rounded-2xl border-2 hover:bg-gray-50 text-gray-600"
                            >
                                <ArrowLeft className="w-6 h-6 mr-2" />
                                {t("steps.back")}
                            </Button>
                        )}
                        
                        {step < 2 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="h-16 text-xl rounded-2xl bg-gray-900 hover:bg-gray-800 text-white flex-1 shadow-lg shadow-gray-200"
                            >
                                {t("steps.next")}
                                <ArrowRight className="w-6 h-6 ml-2" />
                            </Button>
                        ) : (
                            <Button 
                                type="submit" 
                                className="h-16 text-xl font-bold bg-red-600 hover:bg-red-700 text-white flex-1 shadow-xl shadow-red-200 rounded-2xl" 
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-8 w-8 animate-spin" /> : t("submit")}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
