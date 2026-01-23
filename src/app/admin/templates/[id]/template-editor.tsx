"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateTemplate } from "@/lib/actions/template-actions";
import { toast } from "sonner";
import { MessageTemplate } from "@prisma/client";

interface TemplateEditorProps {
    template: MessageTemplate;
}

export function TemplateEditor({ template }: TemplateEditorProps) {
    const [subject, setSubject] = useState(template.subject || "");
    const [body, setBody] = useState(template.body);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateTemplate(template.id, {
                subject: template.channel === "EMAIL" ? subject : undefined,
                body,
            });

            if (result.success) {
                toast.success("Template saved successfully");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to save template");
        } finally {
            setIsSaving(false);
        }
    };

    const renderPreview = () => {
        let preview = body;
        const mockData: Record<string, string> = {
            full_name: "John Doe",
            event_title: "Global Education Expo 2025",
            event_date: "March 15, 2025",
            event_time: "10:00 AM",
            venue_name: "International Trade Center",
            qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MOCK_TOKEN",
            confirmation_url: "http://localhost:3000/r/mock-token",
        };

        Object.entries(mockData).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, "g");
            preview = preview.replace(regex, value);
        });

        // Convert newlines to breaks for HTML preview if email
        if (template.channel === "EMAIL") {
            return (
                <div className="p-6 bg-white border rounded shadow-sm text-gray-800 max-w-2xl mx-auto overflow-auto">
                    {subject && <h2 className="text-xl font-bold mb-4">{subject}</h2>}
                    <div className="whitespace-pre-wrap">{preview}</div>
                    {preview.includes("qr_code_url") && (
                        <div className="mt-6 flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mockData.qr_code_url} alt="QR Code" className="w-32 h-32" />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="p-4 bg-[#DCF8C6] border rounded shadow-sm text-gray-800 max-w-sm mx-auto whitespace-pre-wrap">
                {preview}
            </div>
        );
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Editor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {template.channel === "EMAIL" && (
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject Line</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="body">Message Body</Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="min-h-[400px] font-mono text-sm"
                            placeholder="Use {{variable_name}} for dynamic content"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => {
                            setSubject(template.subject || "");
                            setBody(template.body);
                        }}>
                            Reset Changes
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Template"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="desktop">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="desktop">Preview Content</TabsTrigger>
                            <TabsTrigger value="variable-guide">Variables Help</TabsTrigger>
                        </TabsList>
                        <TabsContent value="desktop" className="bg-muted/30 rounded-lg p-4 min-h-[500px]">
                            {renderPreview()}
                        </TabsContent>
                        <TabsContent value="variable-guide">
                            <div className="space-y-3 p-4">
                                <h4 className="font-semibold text-sm">Available Placeholders:</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><code className="text-purple-600">{"{{"}full_name{"}}"}</code> - Student&apos;s full name</li>
                                    <li><code className="text-purple-600">{"{{"}event_title{"}}"}</code> - Event name</li>
                                    <li><code className="text-purple-600">{"{{"}event_date{"}}"}</code> - Day, Month Date, Year</li>
                                    <li><code className="text-purple-600">{"{{"}event_time{"}}"}</code> - Start time</li>
                                    <li><code className="text-purple-600">{"{{"}venue_name{"}}"}</code> - Venue where event is held</li>
                                    <li><code className="text-purple-600">{"{{"}qr_code_url{"}}"}</code> - Link to access the QR code</li>
                                </ul>
                                <p className="text-xs italic text-orange-600 mt-4">
                                    Note: WhatsApp templates usually require pre-approval by Meta if sending as business initiator.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
