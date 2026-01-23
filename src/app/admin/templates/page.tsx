import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit2, Mail, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/role-check";
import { AdminRole, MessageChannel } from "@prisma/client";

// Mock data
const MOCK_TEMPLATES = [
    {
        id: "1",
        name: "confirmation_email",
        channel: MessageChannel.EMAIL,
        subject: "Welcome to {{event_title}}",
        body: "Hi {{full_name}}, your registration is confirmed.",
        description: "Primary confirmation email sent after registration.",
    },
    {
        id: "2",
        name: "reminder_whatsapp",
        channel: MessageChannel.WHATSAPP,
        body: "Hi {{full_name}}, looking forward to seeing you at {{event_title}} tomorrow!",
        description: "WhatsApp reminder sent 24h before event.",
    }
];

function isDatabaseConfigured(): boolean {
    return !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[project-ref]'));
}

async function getTemplates() {
    if (!isDatabaseConfigured()) {
        return MOCK_TEMPLATES;
    }

    try {
        const { prisma } = await import("@/lib/db");
        return await prisma.messageTemplate.findMany({
            orderBy: { name: "asc" },
        });
    } catch (error) {
        console.error("Templates database error, using mock data:", error);
        return MOCK_TEMPLATES;
    }
}

export default async function TemplatesPage() {
    await requireRole([AdminRole.SUPER_ADMIN]);
    const templates = await getTemplates();

    const emailTemplates = (templates as any[]).filter((t) => t.channel === "EMAIL");
    const whatsappTemplates = (templates as any[]).filter((t) => t.channel === "WHATSAPP");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Message Templates</h1>
                <p className="text-muted-foreground">Manage automated emails and WhatsApp messages</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-500" />
                                Email Templates
                            </CardTitle>
                            <Badge variant="outline">{emailTemplates.length}</Badge>
                        </div>
                        <CardDescription>Transactional emails sent to registrants</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {emailTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-sm capitalize">
                                        {template.name.replace(/_/g, " ")}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {template.subject}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/admin/templates/${template.id}`}>
                                        <Edit2 className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-green-500" />
                                WhatsApp Templates
                            </CardTitle>
                            <Badge variant="outline">{whatsappTemplates.length}</Badge>
                        </div>
                        <CardDescription>Messaging templates for manual or automated notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {whatsappTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-sm capitalize">
                                        {template.name.replace(/_/g, " ")}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {template.body}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/admin/templates/${template.id}`}>
                                        <Edit2 className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Template Variables</CardTitle>
                    <CardDescription>Use these placeholders in your templates</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <VariableItem name="full_name" description="Registrant's full name" />
                        <VariableItem name="event_title" description="Title of the event" />
                        <VariableItem name="event_date" description="Formatted start date" />
                        <VariableItem name="event_time" description="Formatted start time" />
                        <VariableItem name="venue_name" description="Name of the venue" />
                        <VariableItem name="qr_code_url" description="URL to the QR code image" />
                        <VariableItem name="confirmation_url" description="Direct link to success page" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function VariableItem({ name, description }: { name: string; description: string }) {
    return (
        <div className="p-3 rounded-lg border bg-muted/50">
            <code className="text-xs font-bold text-purple-600">{"{{"}{name}{"}}"}</code>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
    );
}
