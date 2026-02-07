"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    X, 
    Star, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    GraduationCap,
    CheckCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Student {
    id: string;
    registrantId: string;
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    interestedMajor: string | null;
    majorCategory: string | null;
    levelOfStudy: string | null;
    checkedIn: boolean;
    isFavorite: boolean;
    favoriteId: string | null;
    favoriteNote: string | null;
    favoriteRating: number;
}

interface StudentSearchModalProps {
    eventId: string;
    isOpen: boolean;
    onClose: () => void;
    onFavoriteAdded?: () => void;
}

export function StudentSearchModal({ eventId, isOpen, onClose, onFavoriteAdded }: StudentSearchModalProps) {
    const [query, setQuery] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [note, setNote] = useState("");
    const [rating, setRating] = useState(0);
    const [adding, setAdding] = useState(false);

    // Debounced search
    const searchStudents = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setStudents([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/university/students/search?eventId=${eventId}&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchStudents(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchStudents]);

    const handleAddFavorite = async () => {
        if (!selectedStudent) return;
        
        setAdding(true);
        try {
            const res = await fetch("/api/university/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId,
                    registrationId: selectedStudent.id,
                    note: note || null,
                    rating
                })
            });

            if (res.ok) {
                setSelectedStudent(null);
                setNote("");
                setRating(0);
                setQuery("");
                setStudents([]);
                onFavoriteAdded?.();
                onClose();
            }
        } catch (error) {
            console.error("Failed to add favorite:", error);
        } finally {
            setAdding(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-red-50 to-orange-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Find Student</h2>
                                <p className="text-sm text-slate-500">Search and add to favorites</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-10 h-12 bg-slate-50 border-slate-200"
                                autoFocus
                            />
                            {loading && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
                            )}
                        </div>
                    </div>

                    {/* Results / Selected Student Form */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {selectedStudent ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 space-y-4"
                            >
                                {/* Selected Student Info */}
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-slate-900">{selectedStudent.fullName}</h3>
                                        <button 
                                            onClick={() => setSelectedStudent(null)}
                                            className="text-sm text-slate-500 hover:text-slate-700"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3.5 h-3.5" />
                                            {selectedStudent.email}
                                        </span>
                                        {selectedStudent.majorCategory && (
                                            <span className="flex items-center gap-1">
                                                <GraduationCap className="w-3.5 h-3.5" />
                                                {selectedStudent.majorCategory}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRating(star)}
                                                className="p-1 transition-transform hover:scale-110"
                                            >
                                                <Star 
                                                    className={`w-6 h-6 ${star <= rating 
                                                        ? 'text-amber-400 fill-amber-400' 
                                                        : 'text-slate-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Note (optional)</label>
                                    <Textarea
                                        placeholder="Add notes about this student..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Add Button */}
                                <Button
                                    onClick={handleAddFavorite}
                                    disabled={adding}
                                    className="w-full h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                >
                                    {adding ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Star className="w-4 h-4 mr-2" />
                                    )}
                                    Add to Favorites
                                </Button>
                            </motion.div>
                        ) : (
                            <div className="p-2">
                                {students.length === 0 && query.length >= 2 && !loading && (
                                    <div className="text-center py-8 text-slate-500">
                                        <User className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                        <p>No students found</p>
                                    </div>
                                )}

                                {students.length === 0 && query.length < 2 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <Search className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                        <p>Type at least 2 characters to search</p>
                                    </div>
                                )}

                                {students.map((student, index) => (
                                    <motion.button
                                        key={student.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => !student.isFavorite && setSelectedStudent(student)}
                                        disabled={student.isFavorite}
                                        className={`w-full text-left p-3 rounded-xl transition-colors mb-1 ${
                                            student.isFavorite 
                                                ? 'bg-amber-50 border border-amber-200 cursor-not-allowed'
                                                : 'hover:bg-slate-50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-900">{student.fullName}</span>
                                                    {student.checkedIn && (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    )}
                                                    {student.isFavorite && (
                                                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                            Favorited
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {student.email}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {student.phone}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {student.city}, {student.country}
                                                    </span>
                                                    {student.majorCategory && (
                                                        <span className="flex items-center gap-1">
                                                            <GraduationCap className="w-3 h-3" />
                                                            {student.majorCategory}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
