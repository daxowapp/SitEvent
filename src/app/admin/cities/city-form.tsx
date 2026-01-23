"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Plus, Trash2, MapPin, Utensils, Bus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createCity, updateCity, Attraction, CafeOrFood, Transportation } from "./actions";

interface CityFormProps {
    city?: {
        id: string;
        name: string;
        countryId: string;
        description: string | null;
        bannerImageUrl: string | null;
        attractions: Attraction[] | null;
        cafesAndFood: CafeOrFood[] | null;
        transportation: Transportation | null;
        localTips: string | null;
        emergencyInfo: string | null;
    };
    countries: Array<{
        id: string;
        name: string;
        flagEmoji: string | null;
    }>;
}

export function CityForm({ city, countries }: CityFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"basic" | "attractions" | "food" | "transport" | "tips">("basic");

    const [formData, setFormData] = useState({
        name: city?.name || "",
        countryId: city?.countryId || "",
        description: city?.description || "",
        bannerImageUrl: city?.bannerImageUrl || "",
        attractions: (city?.attractions as Attraction[]) || [],
        cafesAndFood: (city?.cafesAndFood as CafeOrFood[]) || [],
        transportation: (city?.transportation as Transportation) || {},
        localTips: city?.localTips || "",
        emergencyInfo: city?.emergencyInfo || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (city) {
                await updateCity(city.id, formData);
            } else {
                await createCity(formData);
            }
            router.push("/admin/cities");
        } catch (error) {
            console.error("Failed to save city:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Attraction handlers
    const addAttraction = () => {
        setFormData({
            ...formData,
            attractions: [...formData.attractions, { name: "", description: "", imageUrl: "", mapUrl: "" }]
        });
    };

    const updateAttraction = (index: number, field: keyof Attraction, value: string) => {
        const updated = [...formData.attractions];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, attractions: updated });
    };

    const removeAttraction = (index: number) => {
        setFormData({
            ...formData,
            attractions: formData.attractions.filter((_, i) => i !== index)
        });
    };

    // Cafe handlers
    const addCafe = () => {
        setFormData({
            ...formData,
            cafesAndFood: [...formData.cafesAndFood, { name: "", cuisine: "", priceRange: "", address: "", mapUrl: "" }]
        });
    };

    const updateCafe = (index: number, field: keyof CafeOrFood, value: string) => {
        const updated = [...formData.cafesAndFood];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, cafesAndFood: updated });
    };

    const removeCafe = (index: number) => {
        setFormData({
            ...formData,
            cafesAndFood: formData.cafesAndFood.filter((_, i) => i !== index)
        });
    };

    const tabs = [
        { id: "basic", label: "Basic Info", icon: MapPin },
        { id: "attractions", label: "Attractions", icon: MapPin, count: formData.attractions.length },
        { id: "food", label: "Food & Cafes", icon: Utensils, count: formData.cafesAndFood.length },
        { id: "transport", label: "Transportation", icon: Bus },
        { id: "tips", label: "Tips & Emergency", icon: AlertCircle },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/cities">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {city ? `Edit ${city.name}` : "Add City"}
                    </h1>
                    <p className="text-muted-foreground">
                        {city ? "Update city information and content" : "Add city with local information for events"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="bg-background text-foreground px-1.5 py-0.5 rounded-full text-xs">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Basic Info Tab */}
                {activeTab === "basic" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>City name, country, and general description</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">City Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Cairo"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="countryId">Country *</Label>
                                    <select
                                        id="countryId"
                                        value={formData.countryId}
                                        onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Select a country</option>
                                        {countries.map((country) => (
                                            <option key={country.id} value={country.id}>
                                                {country.flagEmoji} {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bannerImageUrl">Banner Image URL</Label>
                                <Input
                                    id="bannerImageUrl"
                                    placeholder="https://..."
                                    value={formData.bannerImageUrl}
                                    onChange={(e) => setFormData({ ...formData, bannerImageUrl: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of the city..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Attractions Tab */}
                {activeTab === "attractions" && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Attractions & Places to Visit</CardTitle>
                                <CardDescription>Tourist attractions, landmarks, and interesting places</CardDescription>
                            </div>
                            <Button type="button" variant="outline" onClick={addAttraction}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Attraction
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.attractions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No attractions added yet. Click "Add Attraction" to get started.
                                </div>
                            ) : (
                                formData.attractions.map((attraction, index) => (
                                    <div key={index} className="p-4 border rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Attraction {index + 1}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeAttraction(index)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Input
                                                placeholder="Name"
                                                value={attraction.name}
                                                onChange={(e) => updateAttraction(index, "name", e.target.value)}
                                            />
                                            <Input
                                                placeholder="Google Maps URL"
                                                value={attraction.mapUrl || ""}
                                                onChange={(e) => updateAttraction(index, "mapUrl", e.target.value)}
                                            />
                                        </div>
                                        <Textarea
                                            placeholder="Description"
                                            value={attraction.description || ""}
                                            onChange={(e) => updateAttraction(index, "description", e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Food Tab */}
                {activeTab === "food" && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Cafes & Restaurants</CardTitle>
                                <CardDescription>Recommended places to eat and drink</CardDescription>
                            </div>
                            <Button type="button" variant="outline" onClick={addCafe}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Place
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.cafesAndFood.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No cafes or restaurants added yet.
                                </div>
                            ) : (
                                formData.cafesAndFood.map((cafe, index) => (
                                    <div key={index} className="p-4 border rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Place {index + 1}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeCafe(index)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Input
                                                placeholder="Name"
                                                value={cafe.name}
                                                onChange={(e) => updateCafe(index, "name", e.target.value)}
                                            />
                                            <Input
                                                placeholder="Cuisine type"
                                                value={cafe.cuisine || ""}
                                                onChange={(e) => updateCafe(index, "cuisine", e.target.value)}
                                            />
                                            <Input
                                                placeholder="Price range (e.g., $$)"
                                                value={cafe.priceRange || ""}
                                                onChange={(e) => updateCafe(index, "priceRange", e.target.value)}
                                            />
                                            <Input
                                                placeholder="Google Maps URL"
                                                value={cafe.mapUrl || ""}
                                                onChange={(e) => updateCafe(index, "mapUrl", e.target.value)}
                                            />
                                        </div>
                                        <Input
                                            placeholder="Address"
                                            value={cafe.address || ""}
                                            onChange={(e) => updateCafe(index, "address", e.target.value)}
                                        />
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Transportation Tab */}
                {activeTab === "transport" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Transportation Information</CardTitle>
                            <CardDescription>Airport, metro, taxi, and getting around</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="airport">Airport Information</Label>
                                <Textarea
                                    id="airport"
                                    placeholder="Nearest airport, how to get to city center..."
                                    value={formData.transportation.airport || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        transportation: { ...formData.transportation, airport: e.target.value }
                                    })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metro">Metro/Public Transit</Label>
                                <Textarea
                                    id="metro"
                                    placeholder="Metro lines, bus systems, how to use..."
                                    value={formData.transportation.metro || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        transportation: { ...formData.transportation, metro: e.target.value }
                                    })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxi">Taxi & Ride Services</Label>
                                <Textarea
                                    id="taxi"
                                    placeholder="Uber, local taxi apps, typical fares..."
                                    value={formData.transportation.taxi || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        transportation: { ...formData.transportation, taxi: e.target.value }
                                    })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="transportTips">General Tips</Label>
                                <Textarea
                                    id="transportTips"
                                    placeholder="Useful tips for getting around..."
                                    value={formData.transportation.tips || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        transportation: { ...formData.transportation, tips: e.target.value }
                                    })}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tips Tab */}
                {activeTab === "tips" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Local Tips & Emergency Info</CardTitle>
                            <CardDescription>Helpful information for visitors</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="localTips">Local Tips</Label>
                                <Textarea
                                    id="localTips"
                                    placeholder="Cultural tips, best times to visit, local customs..."
                                    value={formData.localTips}
                                    onChange={(e) => setFormData({ ...formData, localTips: e.target.value })}
                                    rows={5}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emergencyInfo">Emergency Information</Label>
                                <Textarea
                                    id="emergencyInfo"
                                    placeholder="Emergency numbers, nearby hospitals, embassy contacts..."
                                    value={formData.emergencyInfo}
                                    onChange={(e) => setFormData({ ...formData, emergencyInfo: e.target.value })}
                                    rows={5}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/cities">Cancel</Link>
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
                                {city ? "Update City" : "Create City"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
