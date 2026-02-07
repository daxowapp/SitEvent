"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    Loader2,
    Command,
    Calendar,
    ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    eventId: string;
    eventTitle: string;
    eventSlug: string;
    isFavorite: boolean;
    favoriteId: string | null;
    favoriteNote: string | null;
    favoriteRating: number;
}

interface GlobalSearchProps {
    onSelectStudent?: (student: Student) => void;
}

export function GlobalSearch({ onSelectStudent }: GlobalSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [note, setNote] = useState("");
    const [rating, setRating] = useState(0);
    const [adding, setAdding] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Keyboard shortcut: Cmd+K / Ctrl+K to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Debounced global search
    const searchStudents = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setStudents([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/university/students/search?global=true&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setStudents(data.students || []);
            setSelectedIndex(0);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchStudents(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchStudents]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (selectedStudent) {
            if (e.key === "Escape") {
                e.preventDefault();
                handleBackToResults();
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, students.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && students[selectedIndex]) {
            handleSelectStudent(students[selectedIndex]);
        }
    };

    const handleSelectStudent = (student: Student) => {
        if (onSelectStudent) {
            onSelectStudent(student);
            setIsOpen(false);
            setQuery("");
            setStudents([]);
        } else {
            // Show student detail panel
            setSelectedStudent(student);
            setNote(student.favoriteNote || "");
            setRating(student.favoriteRating || 0);
        }
    };

    const handleAddFavorite = async () => {
        if (!selectedStudent) return;
        
        setAdding(true);
        try {
            const res = await fetch("/api/university/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: selectedStudent.eventId,
                    registrationId: selectedStudent.id,
                    note: note || null,
                    rating
                })
            });

            if (res.ok) {
                // Update the selected student state to reflect the change
                setSelectedStudent(prev => prev ? { ...prev, isFavorite: true, favoriteNote: note, favoriteRating: rating } : null);
                
                // Update the student in the list to show as favorited
                setStudents(prev => prev.map(s => 
                    s.id === selectedStudent.id 
                        ? { ...s, isFavorite: true, favoriteNote: note, favoriteRating: rating } 
                        : s
                ));
            }
        } catch (error) {
            console.error("Failed to add favorite:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleGoToEvent = () => {
        if (selectedStudent) {
            router.push(`/en/university/events/${selectedStudent.eventId}`);
            handleClose();
        }
    };

    const handleBackToResults = () => {
        setSelectedStudent(null);
        setNote("");
        setRating(0);
        // Focus back on input
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 0);
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery("");
        setStudents([]);
        setSelectedStudent(null);
        setNote("");
        setRating(0);
    };

    return (
        <>
            {/* Trigger Button - Dark theme matching sidebar */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 group"
            >
                <Search className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                <span className="flex-1 text-left text-sm text-white/40 group-hover:text-white/60">Search students...</span>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white/40">
                    <Command className="w-2.5 h-2.5" />
                    <span>K</span>
                </div>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search Input */}
                            <div className="flex items-center px-5 py-4 border-b border-slate-100">
                                <Search className="w-5 h-5 text-slate-400 mr-3" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search students by name, email, or phone..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 text-lg text-gray-900 bg-transparent outline-none placeholder:text-slate-400"
                                />
                                {loading ? (
                                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                ) : query && (
                                    <button onClick={() => setQuery("")} className="p-1 hover:bg-slate-100 rounded-lg">
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="max-h-[60vh] overflow-y-auto">
                                {selectedStudent ? (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-0"
                                    >
                                        {/* Student Header */}
                                        <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedStudent.fullName}</h2>
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600">
                                                            {selectedStudent.eventTitle}
                                                        </span>
                                                        {selectedStudent.checkedIn && (
                                                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Checked In
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={handleBackToResults}
                                                    className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Mail className="w-4 h-4 text-slate-400" />
                                                        {selectedStudent.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Phone className="w-4 h-4 text-slate-400" />
                                                        {selectedStudent.phone}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin className="w-4 h-4 text-slate-400" />
                                                        {selectedStudent.city}, {selectedStudent.country}
                                                    </div>
                                                    {selectedStudent.majorCategory && (
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <GraduationCap className="w-4 h-4 text-slate-400" />
                                                            {selectedStudent.majorCategory}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Area */}
                                        <div className="p-6 space-y-6">
                                            {/* Rating & Notes */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Quick Rating</label>
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setRating(star)}
                                                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                                            >
                                                                <Star 
                                                                    className={`w-8 h-8 ${star <= rating 
                                                                        ? 'text-amber-400 fill-amber-400' 
                                                                        : 'text-slate-200 hover:text-slate-300'
                                                                    }`}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Notes</label>
                                                    <Textarea
                                                        placeholder="Add quick notes about this student..."
                                                        value={note}
                                                        onChange={(e) => setNote(e.target.value)}
                                                        rows={3}
                                                        className="resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors text-slate-900"
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    onClick={handleGoToEvent}
                                                    variant="outline"
                                                    className="h-12 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    View Full Profile
                                                </Button>
                                                <Button
                                                    onClick={handleAddFavorite}
                                                    disabled={adding || (rating === 0 && !note)}
                                                    className={`h-12 ${
                                                        selectedStudent.isFavorite
                                                            ? 'bg-green-600 hover:bg-green-700'
                                                            : 'bg-slate-900 hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {adding ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    ) : selectedStudent.isFavorite ? (
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                    ) : (
                                                        <Star className="w-4 h-4 mr-2" />
                                                    )}
                                                    {selectedStudent.isFavorite ? 'Update Favorite' : 'Add to Favorites'}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    // Search Results List
                                    <div className="py-2">
                                        {students.length === 0 && query.length >= 2 && !loading && (
                                            <div className="text-center py-12 text-slate-500">
                                                <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p className="text-lg font-medium">No students found</p>
                                                <p className="text-sm">Try a different search term</p>
                                            </div>
                                        )}

                                        {students.length === 0 && query.length < 2 && (
                                            <div className="text-center py-12 text-slate-500">
                                                <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p className="text-lg font-medium">Quick Search</p>
                                                <p className="text-sm">Type at least 2 characters to search</p>
                                                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">↑</span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">↓</span>
                                                        <span>Navigate</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">↵</span>
                                                        <span>Select</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">esc</span>
                                                        <span>Close</span>
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {students.map((student, index) => (
                                            <motion.button
                                                key={student.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                onClick={() => handleSelectStudent(student)}
                                                className={`w-full text-left px-5 py-4 border-b border-slate-50 transition-colors ${
                                                    index === selectedIndex 
                                                        ? 'bg-gradient-to-r from-slate-50 to-white border-l-4 border-l-slate-900 pl-[17px]' 
                                                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-900">{student.fullName}</span>
                                                            {student.checkedIn && (
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                            )}
                                                            {student.isFavorite && (
                                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
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
                                                        <div className="flex gap-3 text-xs text-slate-400">
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
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
                                                            <Calendar className="w-3 h-3" />
                                                            {student.eventTitle}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                <span>Search across all your events</span>
                                <span className="flex items-center gap-1">
                                    Press <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">ESC</span> to close
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
