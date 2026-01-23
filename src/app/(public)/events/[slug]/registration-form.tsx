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

export function RegistrationForm({ eventId, eventSlug }: RegistrationFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [defaultCountry, setDefaultCountry] = useState<Country | undefined>(undefined);

    // Auto-detect user location
    const { country, city, loading: locationLoading } = useGeolocation();

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

    // Auto-fill form when location is detected
    useEffect(() => {
        if (!locationLoading && country) {
            // Only fill if fields are empty to avoid overwriting user input
            const currentCountry = watch("country");
            const currentCity = watch("city");

            if (!currentCountry) {
                // Try to match country list or use raw value if 'Other' is an option
                // Simple strict match for now, could be improved with fuzzy search
                setValue("country", country, { shouldValidate: true });
            }
            if (!currentCity) {
                setValue("city", city, { shouldValidate: true });
            }
        }
    }, [country, city, locationLoading, setValue, watch]);


    // Auto-detect country based on IP
    useEffect(() => {
        fetch("https://ipapi.co/json/")
            .then((res) => res.json())
            .then((data) => {
                if (data && data.country_code) {
                    setDefaultCountry(data.country_code as Country);

                    // Auto-select country field
                    if (data.country_name) {
                        const detectedName = data.country_name;
                        // Try exact match
                        let matchedCountry = COUNTRIES.find(c => c.toLowerCase() === detectedName.toLowerCase());

                        // Handle common mappings if exact match fails
                        if (!matchedCountry) {
                            if (data.country_code === "US") matchedCountry = "USA";
                            else if (data.country_code === "GB") matchedCountry = "UK";
                            else if (data.country_code === "AE") matchedCountry = "UAE";
                            else if (data.country_code === "TR") matchedCountry = "Turkey";
                            else if (data.country_code === "KR") matchedCountry = "South Korea";
                            else if (data.country_code === "SA") matchedCountry = "Saudi Arabia";
                        }

                        if (matchedCountry) {
                            setValue("country", matchedCountry);
                        }
                    }
                }
            })
            .catch((err) => console.error("Failed to detect location", err));
    }, [setValue]);

    const consentValue = watch("consent");

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
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Registration failed");
            }

            toast.success("Registration successful!");
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
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    {...register("fullName")}
                />
                {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register("email")}
                />
                {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
            </div>

            {/* Phone (Smart Input) */}
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, value } }) => (
                        <PhoneInput
                            international
                            defaultCountry={defaultCountry}
                            value={value}
                            onChange={onChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 phone-input-container"
                            placeholder="Enter phone number"
                        />
                    )}
                />
                {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
            </div>

            {/* Country */}
            <div className="space-y-2">
                <Label>Country *</Label>
                <Select onValueChange={(value) => setValue("country", value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
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
                <Label htmlFor="city">City *</Label>
                <Input
                    id="city"
                    placeholder="Your city"
                    {...register("city")}
                />
                {errors.city && (
                    <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
            </div>

            {/* Level of Study (Optional) */}
            <div className="space-y-2">
                <Label>Level of Study</Label>
                <Select onValueChange={(value) => setValue("levelOfStudy", value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select level (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        {STUDY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                                {level.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Interested Major (Optional) */}
            <div className="space-y-2">
                <Label htmlFor="interestedMajor">Interested Major/Program</Label>
                <Textarea
                    id="interestedMajor"
                    placeholder="e.g., Computer Science, Medicine..."
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
                        I agree to the processing of my personal data and accept the{" "}
                        <a href="/privacy" className="text-[hsl(var(--turkish-red))] hover:underline">
                            Privacy Policy
                        </a>{" "}
                        *
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
                {isSubmitting ? "Registering..." : "Complete Registration"}
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
