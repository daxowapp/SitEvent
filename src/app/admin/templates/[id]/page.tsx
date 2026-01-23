import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/role-check";
import { AdminRole } from "@prisma/client";
import { TemplateEditor } from "./template-editor";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

interface TemplateEditPageProps {
    params: Promise<{ id: string }>;
}

function isDatabaseConfigured(): boolean {
    return !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[project-ref]'));
}

async function getTemplate(id: string) {
    if (!isDatabaseConfigured()) {
        return {
            id: "1",
            name: "confirmation_email",
            channel: "EMAIL" as any,
            subject: "Welcome to {{event_title}}",
            body: "Hi {{full_name}}, your registration is confirmed.",
        };
    }

    try {
        const { prisma } = await import("@/lib/db");
        return await prisma.messageTemplate.findUnique({
            where: { id },
        });
    } catch {
        return {
            id: "1",
            name: "confirmation_email",
            channel: "EMAIL" as any,
            subject: "Welcome to {{event_title}}",
            body: "Hi {{full_name}}, your registration is confirmed.",
        };
    }
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
    await requireRole([AdminRole.SUPER_ADMIN]);
    const { id } = await params;

    const template = await getTemplate(id);

    if (!template) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/templates">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold capitalize">
                        {template.name.replace(/_/g, " ")}
                    </h1>
                    <p className="text-muted-foreground">
                        Editing {template.channel.toLowerCase()} template
                    </p>
                </div>
            </div>

            <TemplateEditor template={template as any} />
        </div>
    );
}
