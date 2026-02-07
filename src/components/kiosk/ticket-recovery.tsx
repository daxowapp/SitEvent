"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { recoverTicketKiosk } from "@/app/actions/kiosk";

interface TicketRecoveryProps {
    eventId: string;
    onSuccess: (token?: string) => void;
}

export function TicketRecovery({ eventId, onSuccess }: TicketRecoveryProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await recoverTicketKiosk(email, eventId);
            
            if (result.success) {
                toast.success(`Ticket found for ${result.studentName}!`);
                onSuccess(result.qrToken);
            } else {
                toast.error(result.error || "Could not find registration");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
             <h2 className="text-4xl font-bold mb-8 text-center text-gray-900">Find Your Ticket</h2>
             <p className="text-xl text-gray-500 text-center mb-12">
                 Enter your email address to retrieve your entry pass.
             </p>

             <form onSubmit={handleSearch} className="space-y-8">
                 <div className="space-y-4">
                     <Label htmlFor="email" className="text-2xl text-gray-700">Email Address</Label>
                     <Input 
                        id="email" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com" 
                        className="h-24 text-3xl px-6 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-200"
                        autoFocus
                     />
                 </div>

                 <Button type="submit" size="lg" className="w-full h-24 text-3xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 rounded-2xl" disabled={loading}>
                     {loading ? (
                         <>
                             <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                             Searching...
                         </>
                     ) : (
                         <>
                             <Search className="mr-3 h-8 w-8" />
                             Search Registration
                         </>
                     )}
                 </Button>
             </form>
        </div>
    );
}
