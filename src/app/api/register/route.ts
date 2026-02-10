import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registrationSchema } from "@/lib/validations";
import { generateQrToken } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";
import { sendWhatsAppConfirmation } from "@/lib/whatsapp";
import { format } from "date-fns";
import { enUS, tr, ar } from "date-fns/locale";
import { getTranslations } from "next-intl/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    // Rate limiting: 5 registrations per minute per IP
    const clientId = getClientIdentifier(request.headers);
    const rateLimit = checkRateLimit(`register:${clientId}`, {
        limit: 5,
        windowSeconds: 60,
    });

    if (!rateLimit.success) {
        return NextResponse.json(
            { 
                error: "Too many registration attempts. Please try again later.",
                retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000)
            },
            { 
                status: 429,
                headers: {
                    "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
                    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
                }
            }
        );
    }

    try {
        const body = await request.json();
        const { eventId, utmSource, utmMedium, utmCampaign, locale = 'en', ...formData } = body;

        // Validate form data
        const validationResult = registrationSchema.safeParse(formData);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Check if event exists and is open for registration
        let event = null;

        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[project-ref]')) {
            try {
                const dbEvent = await prisma.event.findUnique({
                    where: { id: eventId },
                    include: {
                        _count: { select: { registrations: true } },
                    },
                });
                if (dbEvent) event = dbEvent;
            } catch (error) {
                console.error("Database check failed:", error);
            }
        }

        if (!event || event.status !== "PUBLISHED") {
            return NextResponse.json(
                { error: "Event not found or not available" },
                { status: 404 }
            );
        }

        const now = new Date();
        if (new Date(event.endDateTime) < now) {
            return NextResponse.json(
                { error: "This event has already ended" },
                { status: 400 }
            );
        }

        if (event.registrationOpenAt && new Date(event.registrationOpenAt) > now) {
            return NextResponse.json(
                { error: "Registration has not opened yet" },
                { status: 400 }
            );
        }

        if (event.registrationCloseAt && new Date(event.registrationCloseAt) < now) {
            return NextResponse.json(
                { error: "Registration is closed" },
                { status: 400 }
            );
        }

        if (event.capacity && event._count.registrations >= event.capacity) {
            return NextResponse.json(
                { error: "Event is at full capacity" },
                { status: 400 }
            );
        }

        // Generate QR token
        let qrToken = generateQrToken();

        // Check for existing registration
        const existingRegistrant = await prisma.registrant.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { phone: data.phone },
                ],
                registrations: {
                    some: { eventId },
                },
            },
        });

        if (existingRegistrant) {
            return NextResponse.json(
                { error: "You are already registered for this event" },
                { status: 400 }
            );
        }

        // Create or find registrant
        let registrant = await prisma.registrant.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { phone: data.phone },
                ],
            },
        });

        if (!registrant) {
            registrant = await prisma.registrant.create({
                data: {
                    fullName: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    country: data.country,
                    city: data.city,
                    nationality: data.nationality,
                    levelOfStudy: data.levelOfStudy,
                    interestedMajor: data.interestedMajor,
                    consentAccepted: data.consent,
                    consentTimestamp: new Date(),
                    utmSource,
                    utmMedium,
                    utmCampaign,
                },
            });
        }

        // Create registration
        const registration = await prisma.registration.create({
            data: {
                eventId,
                registrantId: registrant.id,
                qrToken,
            },
        });

        // Send confirmation messages (async - don't block response)
        const dateLocales = { en: enUS, tr: tr, ar: ar };
        const dateLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;
        const eventDate = format(new Date(event.startDateTime), "PPP p", { locale: dateLocale });
        const eventVenue = `${event.venueName}, ${event.city}`;

        // Fetch translations for email
        const t = await getTranslations({ locale, namespace: 'email.confirmation' });

        // Email
        sendConfirmationEmail({
            to: data.email,
            studentName: data.fullName,
            eventTitle: event.title,
            eventDate,
            eventVenue,
            qrToken,
            translations: {
                subject: t('subject'),
                greeting: t('greeting'),
                body: t('body'),
                eventDetails: t('eventDetails'),
                dateLabel: t('dateLabel'),
                venueLabel: t('venueLabel'),
                qrInstructions: t('qrInstructions'),
                openPass: t('openPass'),
                proTipTitle: t('proTipTitle'),
                proTipBody: t('proTipBody'),
                seeYou: t('seeYou'),
                youreIn: t('youreIn'),
                registrationConfirmed: t('registrationConfirmed'),
                yourEntryPass: t('yourEntryPass'),
            }
        }).then((result) => {
            // Log message status
            prisma.messageLog.create({
                data: {
                    eventId,
                    registrationId: registration.id,
                    channel: "EMAIL",
                    templateName: "confirmation",
                    providerMessageId: result.messageId,
                    status: result.success ? "SENT" : "FAILED",
                    errorText: result.error,
                    sentAt: result.success ? new Date() : null,
                },
            }).catch(console.error);
        });

        // WhatsApp
        sendWhatsAppConfirmation({
            to: data.phone,
            studentName: data.fullName,
            eventTitle: event.title,
            eventDate,
            qrToken,
            language: locale,
        }).then((result) => {
            // Log message status
            prisma.messageLog.create({
                data: {
                    eventId,
                    registrationId: registration.id,
                    channel: "WHATSAPP",
                    templateName: "confirmation",
                    providerMessageId: result.messageId,
                    status: result.success ? "SENT" : "FAILED",
                    errorText: result.error,
                    sentAt: result.success ? new Date() : null,
                },
            }).catch(console.error);
        });

        // Zoho CRM Lead Creation (async - don't block response)
        import("@/lib/zoho").then(({ createZohoLead }) => {
            createZohoLead({
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                country: data.country,
                city: data.city,
                leadSource: (event as any).zohoLeadSource || event.title,
                campaignId: (event as any).zohoCampaignId,
                utmSource,
                utmMedium,
                utmCampaign,
                eventTitle: event.title,
            }).catch(console.error);
        });

        // AI Data Enrichment (Awaited for consistency)
        try {
            const { enrichRegistrantData } = await import("@/lib/ai");
            const enriched = await enrichRegistrantData(data.fullName, data.interestedMajor || null);
            
            if (enriched.gender || enriched.standardizedMajor) {
                await prisma.registrant.update({
                    where: { id: registrant.id },
                    data: {
                        gender: enriched.gender,
                        standardizedMajor: enriched.standardizedMajor,
                        majorCategory: enriched.majorCategory
                    }
                });
            }
        } catch (e) {
            console.error("AI Enrichment error:", e);
            // Continue execution, don't fail registration
        }

        return NextResponse.json({
            success: true,
            registrationId: registration.id,
            qrToken: registration.qrToken,
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Failed to process registration" },
            { status: 500 }
        );
    }
}
