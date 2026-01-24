"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { resendTicket } from "@/app/actions/ticket";
import { useTranslations } from "next-intl";

export function TicketRecoveryDialog() {
    const t = useTranslations('recovery');
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRecover(e: React.FormEvent) {
        e.preventDefault();
        if (!email) {
            toast.error(t('emptyEmail'));
            return;
        }

        setLoading(true);
        try {
            const result = await resendTicket(email);
            if (result.success) {
                toast.success(t('success'));
                setOpen(false);
                setEmail("");
            } else {
                toast.error(result.error || t('error'));
            }
        } catch {
            toast.error(t('errorGeneric'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="text-sm font-medium text-white/80 hover:text-white transition-colors hover:underline">
                    {t('lostTicket')}
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRecover} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="recovery-email">{t('emailLabel')}</Label>
                        <Input
                            id="recovery-email"
                            type="email"
                            placeholder={t('placeholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('sending')}
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                {t('submit')}
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
