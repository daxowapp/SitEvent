"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Mail, 
    Send, 
    Users, 
    User, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    RefreshCw,
    Loader2,
    Bell,
    MailCheck
} from "lucide-react";

interface EventMessagingPanelProps {
    eventId: string;
    eventTitle: string;
    daysUntil: number;
    hoursUntil: number;
    totalRegistrants: number;
    isPast: boolean;
}

type ActionResult = {
    success: boolean;
    message: string;
    details?: any;
};

export function EventMessagingPanel({
    eventId,
    eventTitle,
    daysUntil,
    hoursUntil,
    totalRegistrants,
    isPast,
}: EventMessagingPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<ActionResult | null>(null);
    const [singleEmail, setSingleEmail] = useState("");
    const [customMessage, setCustomMessage] = useState("");
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const autoReminderText = daysUntil >= 2
        ? `${daysUntil} days`
        : hoursUntil >= 2
        ? `${hoursUntil} hours`
        : "a few hours";

    async function handleAction(action: string, options?: any) {
        setActiveAction(action);
        setResult(null);

        startTransition(async () => {
            try {
                let url = "";
                let body: any = {};

                switch (action) {
                    case "resend-all":
                        url = `/api/admin/events/${eventId}/resend-emails`;
                        body = { locale: "en" };
                        break;

                    case "reminder-all":
                        url = `/api/admin/events/${eventId}/send-reminder`;
                        body = customMessage ? { customMessage } : {};
                        break;

                    case "resend-single":
                        if (!singleEmail) {
                            setResult({ success: false, message: "Please enter an email address." });
                            setActiveAction(null);
                            return;
                        }
                        url = `/api/admin/events/${eventId}/send-single`;
                        body = { email: singleEmail, type: "confirmation" };
                        break;

                    case "reminder-single":
                        if (!singleEmail) {
                            setResult({ success: false, message: "Please enter an email address." });
                            setActiveAction(null);
                            return;
                        }
                        url = `/api/admin/events/${eventId}/send-single`;
                        body = {
                            email: singleEmail,
                            type: "reminder",
                            customMessage: customMessage || autoReminderText,
                        };
                        break;
                    
                    case "dryrun-resend":
                        url = `/api/admin/events/${eventId}/resend-emails`;
                        body = { dryRun: true };
                        break;

                    case "dryrun-reminder":
                        url = `/api/admin/events/${eventId}/send-reminder`;
                        body = { dryRun: true };
                        break;
                }

                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                const data = await res.json();

                if (!res.ok) {
                    setResult({
                        success: false,
                        message: data.error || `Failed (${res.status})`,
                        details: data,
                    });
                } else {
                    const sent = data.sent ?? data.email?.sent ?? 0;
                    const failed = data.failed ?? data.email?.failed ?? 0;
                    const total = data.total ?? data.email?.total ?? data.totalRegistrants ?? 0;

                    if (data.dryRun) {
                        setResult({
                            success: true,
                            message: `Preview: ${total} registrants would receive emails.`,
                            details: data,
                        });
                    } else {
                        setResult({
                            success: true,
                            message: `✅ Sent: ${sent} | Failed: ${failed} | Total: ${total}`,
                            details: data,
                        });
                    }
                }
            } catch (err) {
                setResult({
                    success: false,
                    message: err instanceof Error ? err.message : "Network error",
                });
            } finally {
                setActiveAction(null);
            }
        });
    }

    const isLoading = isPending || activeAction !== null;

    return (
        <div className="space-y-6">
            {/* Event Status Banner */}
            <div className={`rounded-xl p-5 border ${
                isPast 
                    ? "bg-gray-50 border-gray-200" 
                    : daysUntil <= 1 
                    ? "bg-amber-50 border-amber-200" 
                    : "bg-emerald-50 border-emerald-200"
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className={`h-5 w-5 ${
                            isPast ? "text-gray-500" : daysUntil <= 1 ? "text-amber-600" : "text-emerald-600"
                        }`} />
                        <div>
                            <p className="font-semibold text-sm">
                                {isPast ? "Event has passed" : `${daysUntil} days (${hoursUntil} hours) until event`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{eventTitle}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold tabular-nums">{totalRegistrants}</p>
                        <p className="text-xs text-muted-foreground">registrants</p>
                    </div>
                </div>
            </div>

            {/* Result Message */}
            {result && (
                <div className={`rounded-lg p-4 border text-sm flex items-start gap-3 ${
                    result.success 
                        ? "bg-green-50 border-green-200 text-green-800" 
                        : "bg-red-50 border-red-200 text-red-800"
                }`}>
                    {result.success 
                        ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" /> 
                        : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    }
                    <div>
                        <p className="font-medium">{result.message}</p>
                        {result.details?.correctedDate && (
                            <p className="text-xs mt-1 opacity-75">Date shown: {result.details.correctedDate}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* === BULK ACTIONS === */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Bulk Actions (All Registrants)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Resend Confirmation to All */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Resend Confirmation Email
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Resend the original registration confirmation with corrected date/time to everyone.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoading}
                                    onClick={() => handleAction("dryrun-resend")}
                                >
                                    {activeAction === "dryrun-resend" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                    Preview
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={isLoading || isPast}
                                    onClick={() => {
                                        if (confirm(`Resend confirmation emails to all ${totalRegistrants} registrants?`)) {
                                            handleAction("resend-all");
                                        }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {activeAction === "resend-all" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                    <MailCheck className="h-3 w-3 mr-1" />
                                    Resend to All ({totalRegistrants})
                                </Button>
                            </div>
                        </div>

                        <hr />

                        {/* Send Reminder to All */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Send Reminder Email
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Send a &quot;happening in {autoReminderText}&quot; reminder with their QR pass.
                            </p>
                            <div className="space-y-2">
                                <Input
                                    placeholder={`Custom message (default: "${autoReminderText}")`}
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    className="text-sm"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isLoading}
                                        onClick={() => handleAction("dryrun-reminder")}
                                    >
                                        {activeAction === "dryrun-reminder" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                        Preview
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={isLoading || isPast}
                                        onClick={() => {
                                            if (confirm(`Send reminder to all ${totalRegistrants} registrants?`)) {
                                                handleAction("reminder-all");
                                            }
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700"
                                    >
                                        {activeAction === "reminder-all" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                        <Bell className="h-3 w-3 mr-1" />
                                        Remind All ({totalRegistrants})
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* === SINGLE PERSON === */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Single Person
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="single-email" className="text-sm">
                                Registrant Email
                            </Label>
                            <Input
                                id="single-email"
                                type="email"
                                placeholder="student@example.com"
                                value={singleEmail}
                                onChange={(e) => setSingleEmail(e.target.value)}
                                className="text-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoading || !singleEmail}
                                onClick={() => handleAction("resend-single")}
                                className="justify-start"
                            >
                                {activeAction === "resend-single" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                <MailCheck className="h-3 w-3 mr-1" />
                                Resend Confirmation
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoading || !singleEmail || isPast}
                                onClick={() => handleAction("reminder-single")}
                                className="justify-start"
                            >
                                {activeAction === "reminder-single" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                <Bell className="h-3 w-3 mr-1" />
                                Send Reminder
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
