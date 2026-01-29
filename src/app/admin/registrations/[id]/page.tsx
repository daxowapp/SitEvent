import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Calendar, QrCode, Mail, Phone, MapPin, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { requireManagerOrAbove } from "@/lib/role-check";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function RegistrationDetailsPage({ params }: PageProps) {
    await requireManagerOrAbove();
    const { id } = await params;

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[project-ref]')) {
        return notFound();
    }

    const registration = await prisma.registration.findUnique({
        where: { id },
        include: {
            registrant: true,
            event: true,
            checkIn: {
                include: {
                    checkedInBy: true
                }
            }
        },
    });

    if (!registration) {
        return notFound();
    }

    const { registrant, event, checkIn } = registration;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/registrations">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Registration Details</h1>
                    <p className="text-muted-foreground text-sm">
                        View attendee information and status
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Registrant Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            Attendee Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                <p className="font-medium text-lg">{registrant.fullName}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div>
                                    <Badge
                                        variant={
                                            registration.status === "REGISTERED"
                                                ? "default"
                                                : registration.status === "CANCELLED"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                    >
                                        {registration.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-gray-700">{registrant.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-gray-700">{registrant.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-gray-700">{registrant.city}, {registrant.country}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="text-xs text-muted-foreground">Nationality</label>
                                <p>{registrant.nationality || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Level of Study</label>
                                <p>{registrant.levelOfStudy || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Major Interest</label>
                                <p>{registrant.interestedMajor || "-"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Event & Check-in Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                Event Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(event.startDateTime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                                </p>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium">{event.venueName}</p>
                                <p className="text-muted-foreground">{event.venueAddress}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-muted-foreground" />
                                App Check-in Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {checkIn ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-green-800">Checked In</p>
                                        <p className="text-sm text-green-700">
                                            {format(new Date(checkIn.checkedInAt), "MMM d, yyyy HH:mm:ss")}
                                        </p>
                                        <p className="text-xs text-green-600 mt-1">
                                            Via: {checkIn.method}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                                    <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-700">Not Checked In</p>
                                        <p className="text-sm text-gray-500">
                                            User has not arrived yet.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t">
                                <label className="text-xs text-muted-foreground">QR Token</label>
                                <code className="block bg-gray-100 p-2 rounded text-xs font-mono mt-1 break-all">
                                    {registration.qrToken}
                                </code>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Marketing Info */}
                    {(registrant.utmSource || registrant.utmMedium || registrant.utmCampaign) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Marketing Attribution</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs space-y-2">
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-muted-foreground">Source</span>
                                    <span className="font-mono">{registrant.utmSource || "-"}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-muted-foreground">Medium</span>
                                    <span className="font-mono">{registrant.utmMedium || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Campaign</span>
                                    <span className="font-mono">{registrant.utmCampaign || "-"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
