"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Star, 
    Trash2, 
    Edit3, 
    Check, 
    X, 
    Mail, 
    Phone, 
    MapPin,
    GraduationCap,
    Loader2,
    Download,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Favorite {
    id: string;
    note: string | null;
    rating: number;
    createdAt: string;
    registration: {
        id: string;
        registrant: {
            fullName: string;
            email: string;
            phone: string;
            country: string;
            city: string;
            interestedMajor: string | null;
            majorCategory: string | null;
            levelOfStudy: string | null;
        }
    }
}

interface FavoritesListProps {
    eventId: string;
    refreshTrigger?: number;
    onFindStudent: () => void;
}

export function FavoritesList({ eventId, refreshTrigger, onFindStudent }: FavoritesListProps) {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState("");
    const [editRating, setEditRating] = useState(0);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/university/favorites?eventId=${eventId}`);
            const data = await res.json();
            setFavorites(data.favorites || []);
        } catch (error) {
            console.error("Failed to fetch favorites:", error);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites, refreshTrigger]);

    const handleEdit = (fav: Favorite) => {
        setEditingId(fav.id);
        setEditNote(fav.note || "");
        setEditRating(fav.rating);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setSaving(true);

        try {
            const res = await fetch(`/api/university/favorites/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: editNote, rating: editRating })
            });

            if (res.ok) {
                setEditingId(null);
                fetchFavorites();
            }
        } catch (error) {
            console.error("Failed to update favorite:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            const res = await fetch(`/api/university/favorites/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setFavorites(prev => prev.filter(f => f.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete favorite:", error);
        } finally {
            setDeleting(null);
        }
    };

    const exportToCSV = () => {
        const headers = ["Name", "Email", "Phone", "Country", "City", "Major Category", "Rating", "Note"];
        const rows = favorites.map(f => [
            f.registration.registrant.fullName,
            f.registration.registrant.email,
            f.registration.registrant.phone,
            f.registration.registrant.country,
            f.registration.registrant.city,
            f.registration.registrant.majorCategory || "",
            f.rating.toString(),
            f.note || ""
        ]);

        const csv = [headers, ...rows].map(row => 
            row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `favorites-${eventId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="text-center py-16">
                <Star className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No favorites yet</h3>
                <p className="text-slate-500 mb-6">Add students to your favorites to track high-potential leads</p>
                <Button 
                    onClick={onFindStudent}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                    <Search className="w-4 h-4 mr-2" />
                    Find Student
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Export */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    className="text-slate-600"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Favorites List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {favorites.map((fav, index) => (
                        <motion.div
                            key={fav.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                        >
                            {editingId === fav.id ? (
                                /* Edit Mode */
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{fav.registration.registrant.fullName}</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                disabled={saving}
                                                className="p-1.5 text-green-500 hover:text-green-600"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setEditRating(star)}
                                                className="p-0.5"
                                            >
                                                <Star className={`w-5 h-5 ${star <= editRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                            </button>
                                        ))}
                                    </div>
                                    <Textarea
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        placeholder="Add notes..."
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{fav.registration.registrant.fullName}</h4>
                                            <div className="flex gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star 
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= fav.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(fav)}
                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(fav.id)}
                                                disabled={deleting === fav.id}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                {deleting === fav.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3.5 h-3.5" />
                                            {fav.registration.registrant.email}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {fav.registration.registrant.phone}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {fav.registration.registrant.city}, {fav.registration.registrant.country}
                                        </span>
                                        {fav.registration.registrant.majorCategory && (
                                            <span className="flex items-center gap-1">
                                                <GraduationCap className="w-3 h-3" />
                                                {fav.registration.registrant.majorCategory}
                                            </span>
                                        )}
                                    </div>

                                    {fav.note && (
                                        <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-900">
                                            {fav.note}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
