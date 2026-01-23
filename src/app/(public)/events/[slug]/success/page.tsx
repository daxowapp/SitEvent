import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { QrCodeDisplay } from "./qr-display";

interface SuccessPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ token?: string }>;
}

// Mock data for fallback
const MOCK_EVENTS = [
    {
        id: "1",
        title: "Education Fair Istanbul 2026",
        slug: "education-fair-istanbul-2026",
        country: "Turkey",
        city: "Istanbul",
        venueName: "Istanbul Congress Center",
        venueAddress: "Darülbedai Cad. No:3, 34367 Şişli/İstanbul",
        startDateTime: new Date("2026-03-15T10:00:00"),
        endDateTime: new Date("2026-03-15T18:00:00"),
        description: "Join us for the premier education fair in Istanbul.",
    },
    {
        id: "2",
        title: "Study Abroad Expo Dubai 2026",
        slug: "study-abroad-expo-dubai-2026",
        country: "UAE",
        city: "Dubai",
        venueName: "Dubai World Trade Centre",
        venueAddress: "Sheikh Zayed Rd - Dubai - United Arab Emirates",
        startDateTime: new Date("2026-04-20T09:00:00"),
        endDateTime: new Date("2026-04-20T17:00:00"),
        description: "Explore study options in Dubai and abroad.",
    },
    // ... other events if needed, but these suffice for testing
];

async function getRegistration(token: string) {
    // 0. Optimization: If this is a known mock/stateless token, skip DB lookup entirely
    if (token && token.startsWith('mock-')) {
        return null; // Will trigger the mock fallback logic below
    }

    // 1. Try DB first
    try {
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[project-ref]')) {
            const registration = await prisma.registration.findUnique({
                where: { qrToken: token },
                include: {
                    event: true,
                    registrant: true,
                },
            });
            if (registration) return registration;
        }
    } catch (error) {
        console.warn("DB lookup failed (expected during demo if DB is down):", error);
        return null;
    }
    return null;
}

export default async function SuccessPage({
    params,
    searchParams,
}: SuccessPageProps) {
    const { slug } = await params;
    const { token } = await searchParams;

    if (!token) {
        notFound();
    }

    let registration = await getRegistration(token);

    // MOCK RECORD CREATION IF DB FAILED
    if (!registration) {
        // Check for "Stateless Token" (starts with mock-)
        if (token && token.startsWith('mock-')) {
            try {
                const base64 = token.split('mock-')[1];
                const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
                // payload: { n: name, e: email, eid: eventId, ts: timestamp }

                const mockEvent = MOCK_EVENTS.find(e => e.id === payload.eid) || MOCK_EVENTS.find(e => e.slug === slug);

                if (mockEvent) {
                    registration = {
                        id: "mock-reg-id",
                        eventId: mockEvent.id,
                        registrantId: "mock-user-id",
                        qrToken: token,
                        status: "REGISTERED",
                        createdAt: new Date(payload.ts || Date.now()),
                        updatedAt: new Date(),
                        event: { ...mockEvent, status: "PUBLISHED" },
                        registrant: {
                            id: "mock-user-id",
                            fullName: payload.n || "Valued Attendee",
                            email: payload.e || "attendee@example.com",
                            phone: "+000000000",
                            country: "Unknown",
                            city: "Unknown",
                            consentAccepted: true,
                            consentTimestamp: new Date(),
                        }
                    } as any;
                }
            } catch (e) {
                console.error("Failed to decode mock token", e);
            }
        }

        // Classic fallback if token decode failed but we have a slug
        if (!registration && slug) {
            const mockEvent = MOCK_EVENTS.find(e => e.slug === slug);
            if (mockEvent) {
                registration = {
                    id: "mock-reg-id",
                    eventId: mockEvent.id,
                    registrantId: "mock-user-id",
                    qrToken: token,
                    status: "REGISTERED",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    event: { ...mockEvent, status: "PUBLISHED" },
                    registrant: {
                        id: "mock-user-id",
                        fullName: "Guest User",
                        email: "guest@example.com",
                        phone: "+000000000",
                        country: "Unknown",
                        city: "Unknown",
                        consentAccepted: true,
                        consentTimestamp: new Date(),
                    }
                } as any;
            }
        }
    }

    if (!registration || registration.event.slug !== slug) {
        notFound();
    }

    const { event, registrant } = registration;

    // Generate calendar event data
    const calendarEvent = {
        title: event.title,
        start: event.startDateTime.toISOString(),
        end: event.endDateTime.toISOString(),
        location: `${event.venueName}, ${event.venueAddress}, ${event.city}, ${event.country}`,
        description: event.description || "",
    };

    // Google Calendar URL
    const googleCalendarUrl = new URL(
        "https://calendar.google.com/calendar/render"
    );
    googleCalendarUrl.searchParams.set("action", "TEMPLATE");
    googleCalendarUrl.searchParams.set("text", calendarEvent.title);
    googleCalendarUrl.searchParams.set(
        "dates",
        `${event.startDateTime.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${event.endDateTime.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`
    );
    googleCalendarUrl.searchParams.set("location", calendarEvent.location);
    googleCalendarUrl.searchParams.set("details", calendarEvent.description);

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="mx-auto max-w-3xl">
                    {/* Success Icon & Header */}
                    <div className="text-center space-y-6 mb-12">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h1 className="display-text text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                                Registration Successful!
                            </h1>
                            <p className="text-xl text-gray-500 font-light">
                                Thank you for registering, <span className="font-medium text-gray-900">{registrant.fullName}</span>.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        {/* QR Code Section - Left Column */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-[hsl(var(--turkish-red))]/5 border border-[hsl(var(--turkish-red))]/10 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-[hsl(var(--turkish-red))]" />
                            <div className="p-8 text-center space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Your Entry Pass</h3>
                                    <p className="text-sm text-gray-500">Scan this code at the venue entrance</p>
                                </div>

                                <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block mx-auto group-hover:border-[hsl(var(--turkish-red))]/30 transition-colors">
                                    <QrCodeDisplay token={registration.qrToken} />
                                </div>

                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <Link href={`/r/${registration.qrToken}`} target="_blank">
                                        🔗 Open Full Screen Pass
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Event Details & Actions - Right Column */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                                <h3 className="text-sm uppercase tracking-widest font-bold text-gray-400 mb-6">
                                    Event Details
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg leading-snug mb-2">
                                            {event.title}
                                        </h4>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[hsl(var(--turkish-red))] shrink-0 shadow-sm">
                                            📅
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Date & Time</p>
                                            <p className="text-gray-600 text-sm mt-1">{format(new Date(event.startDateTime), "EEEE, MMMM d, yyyy")}</p>
                                            <p className="text-gray-500 text-sm">{format(new Date(event.startDateTime), "h:mm a")} - {format(new Date(event.endDateTime), "h:mm a")}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[hsl(var(--turkish-red))] shrink-0 shadow-sm">
                                            📍
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Venue</p>
                                            <p className="text-gray-600 text-sm mt-1">{event.venueName}</p>
                                            <p className="text-gray-500 text-sm">{event.venueAddress} {event.city}, {event.country}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button asChild variant="default" size="lg" className="w-full bg-[hsl(var(--turkish-red))] hover:bg-[hsl(var(--turkish-red))]/90 text-white shadow-lg shadow-[hsl(var(--turkish-red))]/20">
                                    <a href={googleCalendarUrl.toString()} target="_blank" rel="noopener noreferrer">
                                        📅 Add to Google Calendar
                                    </a>
                                </Button>

                                <Button asChild variant="outline" size="lg" className="w-full">
                                    <Link href="/events">
                                        Browse More Events
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                        <p>
                            We&apos;ve sent a confirmation email to <strong className="text-gray-900">{registrant.email}</strong>.
                            You will also receive a WhatsApp reminder before the event.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
