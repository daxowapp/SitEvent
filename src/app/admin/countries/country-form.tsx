"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { createCountry, updateCountry } from "./actions";

interface CountryFormProps {
    country?: {
        id: string;
        name: string;
        code: string;
        flagEmoji: string | null;
        timezone: string;
    };
}

// Common flag emojis for quick selection
const FLAG_EMOJIS = ["🇹🇷", "🇪🇬", "🇸🇦", "🇦🇪", "🇯🇴", "🇱🇧", "🇲🇦", "🇶🇦", "🇰🇼", "🇧🇭", "🇴🇲", "🇵🇸", "🇮🇶", "🇾🇪", "🇸🇾", "🇱🇾", "🇹🇳", "🇩🇿", "🇸🇩", "🇺🇸", "🇬🇧", "🇩🇪", "🇫🇷", "🇮🇹", "🇪🇸", "🇳🇱", "🇧🇪", "🇨🇭", "🇦🇹", "🇵🇱"];

// Common timezones
const TIMEZONES = [
    "UTC",
    "Europe/Istanbul",
    "Africa/Cairo",
    "Asia/Riyadh",
    "Asia/Dubai",
    "Asia/Amman",
    "Asia/Beirut",
    "Africa/Casablanca",
    "Asia/Qatar",
    "Asia/Kuwait",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "America/New_York",
    "America/Los_Angeles",
];

export function CountryForm({ country }: CountryFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: country?.name || "",
        code: country?.code || "",
        flagEmoji: country?.flagEmoji || "",
        timezone: country?.timezone || "UTC",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (country) {
                await updateCountry(country.id, formData);
            } else {
                await createCountry(formData);
            }
            router.push("/admin/countries");
        } catch (error) {
            console.error("Failed to save country:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/countries">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {country ? "Edit Country" : "Add Country"}
                    </h1>
                    <p className="text-muted-foreground">
                        {country ? "Update country details" : "Add a new country for event locations"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Country Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Country Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Turkey"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">ISO Code *</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g., TR"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    maxLength={2}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    2-letter ISO 3166-1 alpha-2 code
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Flag Emoji</Label>
                            <div className="flex flex-wrap gap-2">
                                {FLAG_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, flagEmoji: emoji })}
                                        className={`text-2xl p-2 rounded-lg border transition-all ${formData.flagEmoji === emoji
                                            ? "border-primary bg-primary/10"
                                            : "border-transparent hover:bg-muted"
                                            }`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <Input
                                placeholder="Or paste a custom emoji"
                                value={formData.flagEmoji}
                                onChange={(e) => setFormData({ ...formData, flagEmoji: e.target.value })}
                                className="mt-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timezone">Default Timezone</Label>
                            <select
                                id="timezone"
                                value={formData.timezone}
                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz} value={tz}>
                                        {tz}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/admin/countries">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {country ? "Update Country" : "Create Country"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
