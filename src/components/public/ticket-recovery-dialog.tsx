"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { resendTicket } from "@/app/actions/ticket";

export function TicketRecoveryDialog() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRecover(e: React.FormEvent) {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setLoading(true);
        try {
            const result = await resendTicket(email);
            if (result.success) {
                toast.success("Ticket sent! Check your email.");
                setOpen(false);
                setEmail("");
            } else {
                toast.error(result.error || "Failed to find registration.");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="text-sm font-medium text-white/80 hover:text-white transition-colors hover:underline">
                    Lost Ticket?
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Recover Your Ticket</DialogTitle>
                    <DialogDescription>
                        Enter the email address you used to register. We'll resend your QR code immediately.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRecover} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="recovery-email">Email Address</Label>
                        <Input
                            id="recovery-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Resend My Ticket
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
