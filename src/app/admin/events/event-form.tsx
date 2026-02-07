"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { TranslatableInput, TranslatableTextarea } from "@/components/ui/translatable-input";
import { duplicateEvent } from "@/app/actions/events";

type Translations = Partial<Record<'en' | 'tr' | 'ar', string>>;

interface EventFormData {
    title: string;
    slug: string;
    cityId?: string;
    country: string;
    city: string;
    venueName: string;
    venueAddress: string;
    mapUrl?: string;
    startDateTime: string;
    endDateTime: string;
    timezone: string;
    bannerImageUrl?: string;
    galleryImages: string[];
    description?: string;
    // Multi-language translations
    titleTranslations?: Translations;
    descriptionTranslations?: Translations;
    registrationOpenAt?: string;
    registrationCloseAt?: string;
    capacity?: number;
    // University Pricing
    participationFee?: number;
    currency: string;
    status: "DRAFT" | "PUBLISHED" | "FINISHED";
    // Marketing Tracking
    gaTrackingId?: string;
    fbPixelId?: string;
    linkedInPartnerId?: string;
    tiktokPixelId?: string;
    snapPixelId?: string;
    customHeadScript?: string;
    customBodyScript?: string;
    // Zoho CRM
    zohoCampaignId?: string;
    zohoLeadSource?: string;
}

interface Country {
    id: string;
    name: string;
    code: string;
    flagEmoji: string | null;
    timezone: string;
}

interface City {
    id: string;
    name: string;
    countryId: string;
}

interface EventFormProps {
    initialData?: Partial<EventFormData>;
    onSubmit: (data: EventFormData) => Promise<void>;
    countries?: Country[];
    eventId?: string;
}

const TIMEZONES = [
    "UTC",
    "Europe/Istanbul",
    "Europe/London",
    "Europe/Paris",
    "Asia/Dubai",
    "Asia/Riyadh",
    "America/New_York",
];

export function EventForm({ initialData, onSubmit, countries = [], eventId }: EventFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    const [formData, setFormData] = useState<Partial<EventFormData>>({
        status: "DRAFT",
        timezone: "Europe/Istanbul",
        currency: "USD",
        galleryImages: [],
        ...initialData,
    });

    // Fetch cities when country changes
    useEffect(() => {
        const fetchCities = async () => {
            const selectedCountry = countries.find(c => c.name === formData.country);
            if (!selectedCountry) {
                setCities([]);
                return;
            }

            setLoadingCities(true);
            try {
                const response = await fetch(`/api/admin/countries/${selectedCountry.id}/cities`);
                if (response.ok) {
                    const data = await response.json();
                    setCities(data);
                }
            } catch (error) {
                console.error('Failed to fetch cities:', error);
            } finally {
                setLoadingCities(false);
            }
        };

        fetchCities();
    }, [formData.country, countries]);

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSubmit(formData as EventFormData);
            toast.success("Event saved successfully!");
        } catch (error) {
            if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
                // Redirecting... ignore this error
                return;
            }
            toast.error(error instanceof Error ? error.message : "Failed to save event");
            setIsSubmitting(false);
        }
    };

    const handleDuplicate = async () => {
         if (!eventId) return; 
         
         if (!confirm("Are you sure you want to duplicate this event?")) return;

         setIsSubmitting(true);
         try {
             const result = await duplicateEvent(eventId);
             if (result.success && result.eventId) {
                 toast.success("Event duplicated successfully!");
                 router.push(`/admin/events/${result.eventId}`);
             } else {
                 throw new Error(result.error || "Failed to duplicate");
             }
         } catch (error) {
             console.error("Duplicate error:", error);
             toast.error("Failed to duplicate event");
             setIsSubmitting(false);
         }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <TranslatableInput
                        label="Event Title"
                        value={formData.titleTranslations || { en: formData.title || '' }}
                        onChange={(translations) => {
                            const newTitle = translations.en || formData.title || '';
                            setFormData({
                                ...formData,
                                titleTranslations: translations,
                                title: newTitle,
                                slug: formData.slug || generateSlug(newTitle)
                            });
                        }}
                        placeholder="Education Fair Istanbul 2025"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                        id="slug"
                        value={formData.slug || ""}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="education-fair-istanbul-2025"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) =>
                            setFormData({ ...formData, status: value as EventFormData["status"] })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="PUBLISHED">Published</SelectItem>
                            <SelectItem value="FINISHED">Finished</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
                <h3 className="font-medium">Location</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Country *</Label>
                        <Select
                            value={formData.country || ""}
                            onValueChange={(value) => {
                                const selectedCountry = countries.find(c => c.name === value);
                                setFormData({
                                    ...formData,
                                    country: value,
                                    city: '', // Reset city when country changes
                                    cityId: undefined,
                                    timezone: selectedCountry?.timezone || formData.timezone
                                });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.length > 0 ? (
                                    countries.map((country) => (
                                        <SelectItem key={country.id} value={country.name}>
                                            {country.flagEmoji} {country.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="_none" disabled>
                                        No countries configured
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {countries.length === 0 && (
                            <p className="text-xs text-amber-600">Add countries in Settings → Countries</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>City *</Label>
                        {cities.length > 0 ? (
                            <Select
                                value={formData.city || ""}
                                onValueChange={(value) => {
                                    const selectedCity = cities.find(c => c.name === value);
                                    setFormData({
                                        ...formData,
                                        city: value,
                                        cityId: selectedCity?.id
                                    });
                                }}
                                disabled={!formData.country || loadingCities}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingCities ? "Loading..." : "Select city"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((city) => (
                                        <SelectItem key={city.id} value={city.name}>
                                            {city.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                id="city"
                                value={formData.city || ""}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder={formData.country ? "Enter city name" : "Select country first"}
                                disabled={!formData.country}
                                required
                            />
                        )}
                        {formData.country && cities.length === 0 && !loadingCities && (
                            <p className="text-xs text-muted-foreground">No cities configured for this country. Enter manually or add cities in Settings.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="venueName">Venue Name *</Label>
                        <Input
                            id="venueName"
                            value={formData.venueName || ""}
                            onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                            placeholder="Istanbul Congress Center"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="venueAddress">Venue Address *</Label>
                        <Input
                            id="venueAddress"
                            value={formData.venueAddress || ""}
                            onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                            placeholder="123 Main Street"
                            required
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="mapUrl">Google Maps URL</Label>
                        <Input
                            id="mapUrl"
                            type="url"
                            value={formData.mapUrl || ""}
                            onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                            placeholder="https://maps.google.com/..."
                        />
                    </div>
                </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
                <h3 className="font-medium">Date & Time</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="startDateTime">Start Date & Time *</Label>
                        <Input
                            id="startDateTime"
                            type="datetime-local"
                            value={formData.startDateTime || ""}
                            onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDateTime">End Date & Time *</Label>
                        <Input
                            id="endDateTime"
                            type="datetime-local"
                            value={formData.endDateTime || ""}
                            onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Timezone *</Label>
                        <Select
                            value={formData.timezone}
                            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Registration Settings */}
            <div className="space-y-4">
                <h3 className="font-medium">Registration & Pricing</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="registrationOpenAt">Registration Opens</Label>
                        <Input
                            id="registrationOpenAt"
                            type="datetime-local"
                            value={formData.registrationOpenAt || ""}
                            onChange={(e) => setFormData({ ...formData, registrationOpenAt: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="registrationCloseAt">Registration Closes</Label>
                        <Input
                            id="registrationCloseAt"
                            type="datetime-local"
                            value={formData.registrationCloseAt || ""}
                            onChange={(e) => setFormData({ ...formData, registrationCloseAt: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="capacity">Visitor Capacity</Label>
                        <Input
                            id="capacity"
                            type="number"
                            min="0"
                            value={formData.capacity || ""}
                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
                            placeholder="Unlimited"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="participationFee">University Fee</Label>
                        <Input
                            id="participationFee"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.participationFee || ""}
                            onChange={(e) => setFormData({ ...formData, participationFee: parseFloat(e.target.value) || undefined })}
                            placeholder="e.g. 5000"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                            value={formData.currency || "USD"}
                            onValueChange={(value) => setFormData({ ...formData, currency: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="TRY">TRY (₺)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                <SelectItem value="SAR">SAR (﷼)</SelectItem>
                                <SelectItem value="AED">AED (د.إ)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Media & Content */}
            <div className="space-y-4">
                <h3 className="font-medium">Media & Content</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bannerImageUrl">Banner Image</Label>
                        <ImageUpload
                            value={formData.bannerImageUrl}
                            onChange={(url) => setFormData({ ...formData, bannerImageUrl: url })}
                            onRemove={() => setFormData({ ...formData, bannerImageUrl: undefined })}
                            bucket="events-media"
                            folder="events"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Gallery Images</Label>
                        <MultiImageUpload
                            value={formData.galleryImages || []}
                            onChange={(urls) => setFormData({ ...formData, galleryImages: urls })}
                            onRemove={(urlToRemove) =>
                                setFormData({
                                    ...formData,
                                    galleryImages: (formData.galleryImages || []).filter(
                                        (url) => url !== urlToRemove
                                    ),
                                })
                            }
                            bucket="events-media"
                            folder="events/gallery"
                        />
                        <p className="text-xs text-muted-foreground">
                            Upload multiple images for the event gallery.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <TranslatableTextarea
                            label="Description"
                            value={formData.descriptionTranslations || { en: formData.description || '' }}
                            onChange={(translations) => setFormData({
                                ...formData,
                                descriptionTranslations: translations,
                                description: translations.en || formData.description
                            })}
                            placeholder="Event description..."
                            rows={5}
                        />
                        <p className="text-xs text-muted-foreground">
                            Use the language tabs above to add translations. English is used as fallback.
                        </p>
                    </div>
                </div>
            </div>

            {/* Marketing & Tracking */}
            <div className="space-y-4">
                <h3 className="font-medium">Marketing & Tracking</h3>
                <p className="text-sm text-muted-foreground">
                    Add tracking pixels and scripts for this event. These will be injected on the public event page.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="gaTrackingId">Google Analytics ID</Label>
                        <Input
                            id="gaTrackingId"
                            value={formData.gaTrackingId || ""}
                            onChange={(e) => setFormData({ ...formData, gaTrackingId: e.target.value })}
                            placeholder="G-XXXXXXXXXX"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fbPixelId">Facebook Pixel ID</Label>
                        <Input
                            id="fbPixelId"
                            value={formData.fbPixelId || ""}
                            onChange={(e) => setFormData({ ...formData, fbPixelId: e.target.value })}
                            placeholder="123456789012345"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="linkedInPartnerId">LinkedIn Partner ID</Label>
                        <Input
                            id="linkedInPartnerId"
                            value={formData.linkedInPartnerId || ""}
                            onChange={(e) => setFormData({ ...formData, linkedInPartnerId: e.target.value })}
                            placeholder="123456"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tiktokPixelId">TikTok Pixel ID</Label>
                        <Input
                            id="tiktokPixelId"
                            value={formData.tiktokPixelId || ""}
                            onChange={(e) => setFormData({ ...formData, tiktokPixelId: e.target.value })}
                            placeholder="XXXXXXXXXXXXXXXXX"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="snapPixelId">Snapchat Pixel ID</Label>
                        <Input
                            id="snapPixelId"
                            value={formData.snapPixelId || ""}
                            onChange={(e) => setFormData({ ...formData, snapPixelId: e.target.value })}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customHeadScript">Custom Head Script</Label>
                    <Textarea
                        id="customHeadScript"
                        value={formData.customHeadScript || ""}
                        onChange={(e) => setFormData({ ...formData, customHeadScript: e.target.value })}
                        placeholder="<!-- Additional tracking scripts for <head> -->"
                        rows={3}
                        className="font-mono text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customBodyScript">Custom Body Script</Label>
                    <Textarea
                        id="customBodyScript"
                        value={formData.customBodyScript || ""}
                        onChange={(e) => setFormData({ ...formData, customBodyScript: e.target.value })}
                        placeholder="<!-- Additional scripts before </body> -->"
                        rows={3}
                        className="font-mono text-sm"
                    />
                </div>
            </div>

            {/* Zoho CRM Integration */}
            <div className="space-y-4">
                <h3 className="font-medium">Zoho CRM Integration</h3>
                <p className="text-sm text-muted-foreground">
                    Configure how leads from this event are sent to Zoho CRM.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="zohoLeadSource">Lead Source</Label>
                        <Input
                            id="zohoLeadSource"
                            value={formData.zohoLeadSource || ""}
                            onChange={(e) => setFormData({ ...formData, zohoLeadSource: e.target.value })}
                            placeholder="Education Fair Istanbul 2025"
                        />
                        <p className="text-xs text-muted-foreground">
                            This value will appear in the Lead Source field in Zoho.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zohoCampaignId">Campaign ID</Label>
                        <Input
                            id="zohoCampaignId"
                            value={formData.zohoCampaignId || ""}
                            onChange={(e) => setFormData({ ...formData, zohoCampaignId: e.target.value })}
                            placeholder="1234567890123456789"
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional: Link leads to a specific Zoho Campaign.
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : initialData ? "Update Event" : "Create Event"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
