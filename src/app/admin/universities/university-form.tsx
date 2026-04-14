"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Plus, X, Lock, FileUp, Trash2, FileText, Image as ImageIcon, Video, File, Download } from "lucide-react";
import Link from "next/link";
import { createUniversity, updateUniversity, deleteUniversity, generateUniversityData, getUniversityUser, createOrUpdateUniversityUser } from "./actions";
import { ALL_COUNTRIES } from "@/lib/constants/countries";
import { AlertTriangle, Sparkles } from "lucide-react";
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
import { supabase } from "@/lib/supabase-client";
import { createUniversityFile, getUniversityFiles, deleteUniversityFile } from "@/app/actions/university-files";

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

    // Credential Management State
    const [credData, setCredData] = useState({ email: "", password: "" });
    const [hasUser, setHasUser] = useState(false);
    const [isSavingCreds, setIsSavingCreds] = useState(false);

    // File Management State
    const [files, setFiles] = useState<any[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [fileLabel, setFileLabel] = useState("");

    // Fetch existing files for university
    useEffect(() => {
        if (university?.id) {
            getUniversityFiles(university.id).then(setFiles).catch(console.error);
        }
    }, [university?.id]);

    const getFileTypeFromName = (name: string): "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT" => {
        const ext = name.split(".").pop()?.toLowerCase();
        if (ext === "pdf") return "PDF";
        if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "IMAGE";
        if (["mp4", "webm", "mov", "avi"].includes(ext || "")) return "VIDEO";
        return "DOCUMENT";
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case "PDF": return <FileText className="h-5 w-5 text-red-500" />;
            case "IMAGE": return <ImageIcon className="h-5 w-5 text-blue-500" />;
            case "VIDEO": return <Video className="h-5 w-5 text-purple-500" />;
            default: return <File className="h-5 w-5 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!university?.id || !e.target.files?.[0]) return;

        const file = e.target.files[0];
        const label = fileLabel.trim() || file.name;

        if (file.size > 50 * 1024 * 1024) {
            toast.error("File too large (max 50MB)");
            return;
        }

        setIsUploadingFile(true);
        try {
            const filePath = `${university.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from("university-files")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("university-files")
                .getPublicUrl(filePath);

            const result = await createUniversityFile({
                universityId: university.id,
                fileName: file.name,
                fileUrl: urlData.publicUrl,
                fileType: getFileTypeFromName(file.name),
                fileSize: file.size,
                label,
            });

            if (result.success && result.file) {
                setFiles(prev => [result.file, ...prev]);
                setFileLabel("");
                toast.success("File uploaded!");
            } else {
                toast.error("Failed to save file record");
            }
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Upload failed. Check Supabase storage bucket.");
        } finally {
            setIsUploadingFile(false);
            e.target.value = "";
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!university?.id) return;
        const result = await deleteUniversityFile(fileId, university.id);
        if (result.success) {
            setFiles(prev => prev.filter(f => f.id !== fileId));
            toast.success("File removed");
        } else {
            toast.error("Failed to remove file");
        }
    };

    // Fetch existing user credentials
    useEffect(() => {
        if (university?.id) {
            getUniversityUser(university.id).then(user => {
                if (user) {
                    setCredData(prev => ({ ...prev, email: user.email }));
                    setHasUser(true);
                } else if (university.contactEmail) {
                    setCredData(prev => ({ ...prev, email: university.contactEmail || "" }));
                }
            });
        }
    }, [university]);

    const handleSaveCredentials = async () => {
        if (!university) return;
        if (!credData.email) return toast.error("Email is required for login");
        if (!hasUser && !credData.password) return toast.error("Password is required for new user");

        setIsSavingCreds(true);
        try {
            await createOrUpdateUniversityUser(university.id, credData.email, credData.password);
            toast.success(`User ${hasUser ? 'updated' : 'created'}! Password set.`);
            setHasUser(true);
            setCredData(prev => ({ ...prev, password: "" }));
        } catch (e) {
            toast.error("Failed to save credentials");
        } finally {
            setIsSavingCreds(false);
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
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            Portal Access
                        </CardTitle>
                        <CardDescription>Manage login credentials for the university portal</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 items-start">
                            <div className="space-y-2">
                                <Label htmlFor="portalEmail">Login Email</Label>
                                <Input
                                    id="portalEmail"
                                    type="email"
                                    placeholder="user@university.edu"
                                    value={credData.email}
                                    onChange={(e) => setCredData({ ...credData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="portalPassword">Set Password</Label>
                                <Input
                                    id="portalPassword"
                                    type="text"
                                    placeholder={hasUser ? "Enter to reset (leave blank to keep)" : "Required for new user"}
                                    value={credData.password}
                                    onChange={(e) => setCredData({ ...credData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                {!university && (
                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                        ⚠️ Save university first to create login.
                                    </span>
                                )}
                                {hasUser && (
                                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                        ✅ Active User Exists
                                    </span>
                                )}
                            </div>
                            <Button
                                type="button"
                                onClick={handleSaveCredentials}
                                disabled={isSavingCreds || !university}
                                variant="outline"
                                className="border-gray-200 hover:bg-gray-50"
                            >
                                {isSavingCreds ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {hasUser ? "Update Credentials" : "Create Login"}
                            </Button>
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

                {/* Files & Brochures - Only shown when editing existing university */}
                {university && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileUp className="h-5 w-5 text-muted-foreground" />
                                Files & Brochures
                            </CardTitle>
                            <CardDescription>Upload brochures, catalogs, and other media for this university. These will be delivered to students digitally.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Upload Section */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                    placeholder="File label (optional)"
                                    value={fileLabel}
                                    onChange={(e) => setFileLabel(e.target.value)}
                                    className="flex-1"
                                />
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp4"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={isUploadingFile}
                                    />
                                    <Button type="button" variant="outline" className="w-full sm:w-auto pointer-events-none" disabled={isUploadingFile}>
                                        {isUploadingFile ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <FileUp className="h-4 w-4 mr-2" />
                                        )}
                                        {isUploadingFile ? "Uploading..." : "Upload File"}
                                    </Button>
                                </div>
                            </div>

                            {/* File List */}
                            {files.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">No files uploaded yet</p>
                                    <p className="text-xs mt-1">Upload PDFs, images, or documents above</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {files.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors group"
                                        >
                                            {getFileIcon(file.fileType)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{file.label}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {file.fileName} · {formatFileSize(file.fileSize)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    asChild
                                                >
                                                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4 text-blue-600" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteFile(file.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground text-right">{files.length} file(s)</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

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
