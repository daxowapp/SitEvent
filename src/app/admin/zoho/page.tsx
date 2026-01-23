"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ZohoStatus {
    connected: boolean;
    message: string;
    leadId?: string;
    error?: string;
}

export default function ZohoAdminPage() {
    const [status, setStatus] = useState<ZohoStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);

    // Check connection status
    const checkConnection = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/zoho/status");
            const data = await res.json();
            setStatus(data);
            if (data.connected) {
                toast.success("Zoho CRM connected successfully!");
            } else {
                toast.error(data.message || "Connection failed");
            }
        } catch (error) {
            toast.error("Failed to check connection");
            setStatus({ connected: false, message: "Request failed" });
        } finally {
            setLoading(false);
        }
    };

    // Send test lead
    const sendTestLead = async () => {
        setTestLoading(true);
        try {
            const res = await fetch("/api/admin/zoho/test", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast.success(`Test lead created! ID: ${data.leadId}`);
            } else {
                toast.error(data.error || "Failed to create test lead");
            }
        } catch (error) {
            toast.error("Failed to send test lead");
        } finally {
            setTestLoading(false);
        }
    };

    // Check if credentials are set (we'll get this from the status API)
    const hasCredentials = status?.connected || status?.message?.includes("token");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Zoho CRM Integration</h1>
                <p className="text-muted-foreground">
                    Manage your Zoho CRM connection and lead synchronization
                </p>
            </div>

            {/* Connection Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Connection Status
                        {status && (
                            <Badge variant={status.connected ? "default" : "destructive"}>
                                {status.connected ? "✓ Connected" : "✗ Disconnected"}
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Check if your Zoho CRM credentials are configured correctly
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button onClick={checkConnection} disabled={loading}>
                            {loading ? "Checking..." : "Check Connection"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={sendTestLead}
                            disabled={testLoading || !status?.connected}
                        >
                            {testLoading ? "Sending..." : "Send Test Lead"}
                        </Button>
                    </div>

                    {status && (
                        <div className="p-4 rounded-lg bg-muted text-sm">
                            <p><strong>Status:</strong> {status.message}</p>
                            {status.leadId && (
                                <p className="mt-2"><strong>Last Lead ID:</strong> {status.leadId}</p>
                            )}
                            {status.error && (
                                <p className="mt-2 text-destructive"><strong>Error:</strong> {status.error}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Configuration Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>
                        Zoho CRM credentials are stored in environment variables
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 text-sm">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <span className="font-medium">ZOHO_CLIENT_ID</span>
                            <Badge variant="outline">Set in .env</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <span className="font-medium">ZOHO_CLIENT_SECRET</span>
                            <Badge variant="outline">Set in .env</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <span className="font-medium">ZOHO_REFRESH_TOKEN</span>
                            <Badge variant="outline">Set in .env</Badge>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        To update these values, edit the <code className="bg-muted px-1 py-0.5 rounded">.env</code> file
                        and restart the server.
                    </p>
                </CardContent>
            </Card>

            {/* Field Mapping Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Lead Field Mapping</CardTitle>
                    <CardDescription>
                        How event registration data maps to Zoho CRM Lead fields
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 font-medium">Registration Field</th>
                                    <th className="text-left py-2 font-medium">Zoho Lead Field</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="py-2">Full Name</td>
                                    <td className="py-2 font-mono text-xs">First_Name + Last_Name</td>
                                </tr>
                                <tr>
                                    <td className="py-2">Email</td>
                                    <td className="py-2 font-mono text-xs">Email</td>
                                </tr>
                                <tr>
                                    <td className="py-2">Phone</td>
                                    <td className="py-2 font-mono text-xs">Phone</td>
                                </tr>
                                <tr>
                                    <td className="py-2">Country</td>
                                    <td className="py-2 font-mono text-xs">Country</td>
                                </tr>
                                <tr>
                                    <td className="py-2">City</td>
                                    <td className="py-2 font-mono text-xs">City</td>
                                </tr>
                                <tr>
                                    <td className="py-2">Event Title</td>
                                    <td className="py-2 font-mono text-xs">UTM_Source (custom field)</td>
                                </tr>
                                <tr>
                                    <td className="py-2">Lead Source (from event)</td>
                                    <td className="py-2 font-mono text-xs">Lead_Source</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
