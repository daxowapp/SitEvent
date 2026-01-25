"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { registrationSchema, type RegistrationFormData } from "@/lib/validations";
import { toast } from "sonner";
import PhoneInput, { type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css"; // Import standard styles

interface RegistrationFormProps {
    eventId: string;
    eventSlug: string;
}

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
    "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Colombia", "Egypt",
    "France", "Germany", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Italy",
    "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Lebanon", "Libya",
    "Malaysia", "Mexico", "Morocco", "Netherlands", "Nigeria", "Pakistan",
    "Palestine", "Philippines", "Poland", "Portugal", "Qatar", "Russia",
    "Saudi Arabia", "South Africa", "South Korea", "Spain", "Sudan", "Sweden",
    "Switzerland", "Syria", "Tunisia", "Turkey", "UAE", "UK", "USA", "Ukraine",
    "Uzbekistan", "Vietnam", "Yemen", "Other",
];

const STUDY_LEVELS = [
    { value: "bachelor", label: "Bachelor's Degree" },
    { value: "master", label: "Master's Degree" },
    { value: "phd", label: "PhD" },
    { value: "language", label: "Language Course" },
    { value: "other", label: "Other" },
];

import { useGeolocation } from "@/hooks/use-geolocation";

import { useTranslations, useLocale } from "next-intl";

export function RegistrationForm({ eventId, eventSlug }: RegistrationFormProps) {
    const router = useRouter();
    const t = useTranslations("registration");
    const locale = useLocale();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [defaultCountry, setDefaultCountry] = useState<Country | undefined>(undefined);

    // Auto-detect user location
    const { country, countryCode, city, loading: locationLoading } = useGeolocation();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        control,
    } = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            consent: false,
        },
    });

    const consentValue = watch("consent");

    // Update phone input default country
    useEffect(() => {
        if (countryCode) {
            setDefaultCountry(countryCode as Country);
        }
    }, [countryCode]);

    // Autofill location fields
    useEffect(() => {
        if (!locationLoading && country) {
            // We use setValue to pre-fill. 
            // Note: If the country name from API doesn't exactly match our dropdown list, 
            // the Select might not show it selected, but the value is set.
            //Ideally we should check if country exists in COUNTRIES.
            const countryExists = COUNTRIES.includes(country);
            if (countryExists) {
                setValue("country", country);
            }
            if (city) {
                setValue("city", city);
            }
        }
    }, [locationLoading, country, city, setValue]);

    const onSubmit = async (data: RegistrationFormData) => {
        setIsSubmitting(true);

        try {
            // Get UTM params from URL
            const urlParams = new URLSearchParams(window.location.search);
            const utmSource = urlParams.get("utm_source") || undefined;
            const utmMedium = urlParams.get("utm_medium") || undefined;
            const utmCampaign = urlParams.get("utm_campaign") || undefined;

            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    eventId,
                    utmSource,
                    utmMedium,
                    utmCampaign,
                    locale,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || t("error") || "Registration failed");
            }

            toast.success(t("success"));
            router.push(`/events/${eventSlug}/success?token=${result.qrToken}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Registration failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
                <Label htmlFor="fullName">{t("fullName")} *</Label>
                <Input
                    id="fullName"
                    placeholder={t("placeholders.fullName")}
                    {...register("fullName")}
                />
                {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email">{t("email")} *</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder={t("placeholders.email")}
                    {...register("email")}
                    dir="ltr"
                />
                {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
            </div>

            {/* Phone (Smart Input) */}
            <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")} *</Label>
                <div dir="ltr">
                    <Controller
                        control={control}
                        name="phone"
                        render={({ field: { onChange, value } }) => (
                            <PhoneInput
                                international
                                countryCallingCodeEditable={false}
                                defaultCountry={defaultCountry}
                                value={value}
                                onChange={onChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 phone-input-container"
                                placeholder={t("placeholders.phone")}
                            />
                        )}
                    />
                </div>
                {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
            </div>

            {/* Country */}
            <div className="space-y-2">
                <Label>{t("country")} *</Label>
                <Select onValueChange={(value) => setValue("country", value)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t("placeholders.country")} />
                    </SelectTrigger>
                    <SelectContent>
                        {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                                {country}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.country && (
                    <p className="text-sm text-red-500">{errors.country.message}</p>
                )}
            </div>

            {/* City */}
            <div className="space-y-2">
                <Label htmlFor="city">{t("city")} *</Label>
                <Input
                    id="city"
                    placeholder={t("placeholders.city")}
                    {...register("city")}
                />
                {errors.city && (
                    <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
            </div>

            {/* Level of Study (Optional) */}
            <div className="space-y-2">
                <Label>{t("levelOfStudy")}</Label>
                <Select onValueChange={(value) => setValue("levelOfStudy", value)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t("placeholders.level")} />
                    </SelectTrigger>
                    <SelectContent>
                        {STUDY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                                {t(`levelOptions.${level.value}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Interested Major (Optional) */}
            <div className="space-y-2">
                <Label htmlFor="interestedMajor">{t("fieldOfInterest")}</Label>
                <Textarea
                    id="interestedMajor"
                    placeholder={t("placeholders.major")}
                    {...register("interestedMajor")}
                    rows={2}
                />
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 rounded-lg border p-4 bg-white">
                <Checkbox
                    id="consent"
                    checked={consentValue}
                    onCheckedChange={(checked) => setValue("consent", checked as boolean)}
                />
                <div className="space-y-1">
                    <Label htmlFor="consent" className="font-normal cursor-pointer">
                        {t.rich("consent", {
                            link: (chunks) => (
                                <a href="/privacy" className="text-[hsl(var(--turkish-red))] hover:underline">
                                    {chunks}
                                </a>
                            )
                        })}
                    </Label>
                    {errors.consent && (
                        <p className="text-sm text-red-500">{errors.consent.message}</p>
                    )}
                </div>
            </div>

            {/* Submit */}
            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
            >
                {isSubmitting ? t("registering") : t("submitRegistration")}
            </Button>

            <style jsx global>{`
                .PhoneInput {
                    display: flex;
                    align-items: center;
                }
                .PhoneInputCountry {
                    margin-right: 0.5rem;
                }
                .PhoneInputInput {
                    flex: 1;
                    min-width: 0;
                    background-color: transparent;
                    border: none;
                    outline: none;
                }
            `}</style>
        </form>
    );
}
