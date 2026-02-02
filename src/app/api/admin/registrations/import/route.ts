import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateQrToken } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";
import { format } from "date-fns";
import { enUS, tr, ar } from "date-fns/locale";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

// Schema for a single lead in the bulk import
const bulkLeadSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(5),
    country: z.string().default("Unknown"),
    city: z.string().default("Unknown"),
    language: z.enum(["en", "tr", "ar"]).optional().default("en"),
    source: z.string().optional().default("Import"),
});

const importBodySchema = z.object({
    eventId: z.string().min(1),
    leads: z.array(bulkLeadSchema),
});

export async function POST(request: NextRequest) {
    try {
        // 1. Admin Auth Check
        const session = await auth();
        if (!session?.user || (session.user as { type?: string }).type !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await request.json();
        const validation = importBodySchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { eventId, leads } = validation.data;

        // 3. Verify Event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 4. Process Leads
        const results = {
            total: leads.length,
            success: 0,
            updated: 0,
            duplicates: 0,
            errors: 0,
            details: [] as Record<string, unknown>[],
        };

        const dateLocales = { en: enUS, tr: tr, ar: ar };
        const eventVenue = `${event.venueName}, ${event.city}`;

        // Process sequentially to avoid race conditions on Registrant creation
        // and to respect API rate limits if we were calling external services (we are only sending emails)
        for (const lead of leads) {
            try {
                // A. Find or Create Registrant
                let registrant = await prisma.registrant.findFirst({
                    where: { email: lead.email },
                });

                if (!registrant) {
                    registrant = await prisma.registrant.create({
                        data: {
                            fullName: lead.fullName,
                            email: lead.email,
                            phone: lead.phone,
                            country: lead.country,
                            city: lead.city,
                            consentAccepted: true, // Admin imported
                            consentTimestamp: new Date(),
                            utmSource: lead.source,
                        },
                    });
                } else {
                    // Update existing registrant details
                    registrant = await prisma.registrant.update({
                        where: { id: registrant.id },
                        data: {
                            fullName: lead.fullName,
                            phone: lead.phone,
                            country: lead.country,
                            city: lead.city,
                        }
                    });
                }

                // B. Check Registration
                const existingRegistration = await prisma.registration.findUnique({
                    where: {
                        eventId_registrantId: {
                            eventId: event.id,
                            registrantId: registrant.id,
                        },
                    },
                });

                if (existingRegistration) {
                    results.updated++;
                    results.details.push({
                        email: lead.email,
                        status: "updated",
                        message: "Lead details updated",
                        qrToken: existingRegistration.qrToken // Returning QR for report
                    });
                    continue; // Skip email sending
                }

                // C. Create Registration
                const qrToken = generateQrToken();
                const registration = await prisma.registration.create({
                    data: {
                        eventId: event.id,
                        registrantId: registrant.id,
                        qrToken,
                        status: "REGISTERED",
                    },
                });

                // D. Send Email
                const dateLocale = dateLocales[lead.language as keyof typeof dateLocales] || enUS;
                const eventDate = format(new Date(event.startDateTime), "PPP p", { locale: dateLocale });
                
                // We need to fetch translations for each user's language preference
                // Note: In a loop this is not efficient, but for imports < 1000 it's fine.
                // Optimally we'd fetch all translations once if they are static.
                // Assuming standard translations for now.
                const t = await getTranslations({ locale: lead.language, namespace: 'email.confirmation' });

                 await sendConfirmationEmail({
                    to: lead.email,
                    studentName: lead.fullName,
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
                });

                // Log message
                await prisma.messageLog.create({
                    data: {
                        eventId: event.id,
                        registrationId: registration.id,
                        channel: "EMAIL",
                        templateName: "confirmation_import",
                        status: "SENT",
                        sentAt: new Date(),
                    },
                });

                results.success++;
                results.details.push({
                    email: lead.email,
                    status: "success",
                    qrToken,
                });

            } catch (err) {
                console.error(`Failed to import ${lead.email}:`, err);
                results.errors++;
                results.details.push({
                    email: lead.email,
                    status: "error",
                    message: err instanceof Error ? err.message : "Unknown error"
                });
            }
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error("Bulk import critical error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
