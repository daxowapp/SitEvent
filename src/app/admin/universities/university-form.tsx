"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { createUniversity, updateUniversity, deleteUniversity, generateUniversityData } from "./actions";
import { ALL_COUNTRIES } from "@/lib/constants/countries";
import { AlertTriangle, Sparkles, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Country {
    id: string;
    name: string;
    flagEmoji: string | null;
}

interface City {
    id: string;
    name: string;
    countryId: string;
}

interface UniversityFormProps {
    university?: {
        id: string;
        name: string;
        logoUrl: string | null;
        website: string | null;
        country: string;
        city: string | null;
        description: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        programs: string[] | null;
        isActive: boolean;
    };
    countries?: Country[];
}

export function UniversityForm({ university, countries = [] }: UniversityFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [newProgram, setNewProgram] = useState("");
    const [cities, setCities] = useState<City[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    const [formData, setFormData] = useState({
        name: university?.name || "",
        logoUrl: university?.logoUrl || "",
        website: university?.website || "",
        country: university?.country || "",
        city: university?.city || "",
        description: university?.description || "",
        contactEmail: university?.contactEmail || "",
        contactPhone: university?.contactPhone || "",
        programs: (university?.programs as string[]) || [],
        isActive: university?.isActive ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (university) {
                await updateUniversity(university.id, formData);
                toast.success("University updated successfully");
            } else {
                await createUniversity(formData);
                toast.success("University created successfully");
            }
            router.push("/admin/universities");
        } catch (error) {
            console.error("Failed to save university:", error);
            toast.error("Failed to save university");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!university) return;
        setIsDeleting(true);
        try {
            await deleteUniversity(university.id);
            toast.success("University deleted successfully");
            router.push("/admin/universities");
        } catch (error) {
            console.error("Failed to delete university:", error);
            toast.error("Failed to delete university");
            setIsDeleting(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!formData.name) {
            toast.error("Please enter a university name first");
            return;
        }

        setIsGenerating(true);
        try {
            const data = await generateUniversityData(formData.name);
            setFormData(prev => ({
                ...prev,
                ...data, // Spread generated fields
                // Ensure array fields are handled safely if API returns something else
                programs: Array.isArray(data.programs) ? data.programs : prev.programs
            }));
            toast.success("University details generated!");
        } catch (error) {
            console.error("AI Generation failed:", error);
            toast.error("Failed to generate content. Check API Key.");
        } finally {
            setIsGenerating(false);
        }
    };

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

    const addProgram = () => {
        if (newProgram.trim()) {
            setFormData({
                ...formData,
                programs: [...formData.programs, newProgram.trim()]
            });
            setNewProgram("");
        }
    };

    const removeProgram = (index: number) => {
        setFormData({
            ...formData,
            programs: formData.programs.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/universities">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {university ? "Edit University" : "Add University"}
                    </h1>
                    <p className="text-muted-foreground">
                        {university ? "Update university details" : "Add a new university partner"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Basic Information</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAIGenerate}
                                disabled={isGenerating || !formData.name}
                                className="border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-600 text-emerald-600"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                Autofill with AI
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">University Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Istanbul University"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                                id="logoUrl"
                                placeholder="https://..."
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="country">Country *</Label>
                                <select
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value, city: '' })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Select a country</option>
                                    {ALL_COUNTRIES.map((country) => (
                                        <option key={country.code} value={country.name}>
                                            {country.flag} {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                {cities.length > 0 ? (
                                    <select
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        disabled={!formData.country || loadingCities}
                                    >
                                        <option value="">{loadingCities ? 'Loading...' : 'Select a city'}</option>
                                        {cities.map((city) => (
                                            <option key={city.id} value={city.name}>
                                                {city.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <Input
                                        id="city"
                                        placeholder={formData.country ? "Enter city name" : "Select country first"}
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        disabled={!formData.country}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="About the university..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    placeholder="admissions@university.edu"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Contact Phone</Label>
                                <Input
                                    id="contactPhone"
                                    placeholder="+90 xxx xxx xxxx"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Programs</CardTitle>
                        <CardDescription>List of programs or majors offered</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a program (e.g., Computer Science)"
                                value={newProgram}
                                onChange={(e) => setNewProgram(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProgram())}
                            />
                            <Button type="button" onClick={addProgram} variant="outline">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {formData.programs.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.programs.map((program, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm"
                                    >
                                        <span>{program}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeProgram(index)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="isActive">Active</Label>
                                <p className="text-sm text-muted-foreground">
                                    Inactive universities won't appear in event assignments
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center">
                    <div>
                        {university && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete University
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the university
                                            and remove it from all events.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? "Deleting..." : "Delete"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/universities">Cancel</Link>
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
                                    {university ? "Update University" : "Create University"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
