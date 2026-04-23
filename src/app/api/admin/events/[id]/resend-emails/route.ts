import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, tr, ar } from "date-fns/locale";
import { getTranslations } from "next-intl/server";

/**
 * POST /api/admin/events/[id]/resend-emails
 * 
 * Bulk resend corrected confirmation emails to all registrants of an event.
 * Use this after fixing timezone or content issues in emails.
 * 
 * Body (optional):
 * - locale: string (default "en") — language for emails
 * - dryRun: boolean (default false) — if true, only counts affected registrants
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: eventId } = await params;

        // Optional body params
        let locale = "en";
        let dryRun = false;
        try {
            const body = await request.json();
            locale = body.locale || "en";
            dryRun = body.dryRun || false;
        } catch {
            // No body is fine, use defaults
        }

        // 1. Fetch the event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 2. Fetch all registrations with registrant info
        const registrations = await prisma.registration.findMany({
            where: {
                eventId,
                status: "REGISTERED",
            },
            include: {
                registrant: true,
            },
        });

        if (dryRun) {
            return NextResponse.json({
                dryRun: true,
                eventTitle: event.title,
                totalRegistrants: registrations.length,
                message: `Would resend confirmation emails to ${registrations.length} registrants.`,
            });
        }

        // 3. Prepare timezone-correct date string
        const dateLocales = { en: enUS, tr: tr, ar: ar };
        const dateLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;
        const timeZone = event.timezone || "UTC";
        const eventDate = `${formatInTimeZone(new Date(event.startDateTime), timeZone, "PPP", { locale: dateLocale })} ${formatInTimeZone(new Date(event.startDateTime), timeZone, "h:mm a", { locale: dateLocale })}`;
        const eventVenue = `${event.venueName}, ${event.city}`;

        // 4. Fetch translations
        const t = await getTranslations({ locale, namespace: "email.confirmation" });

        // 5. Send emails sequentially with a small delay to avoid rate limits
        const results = {
            total: registrations.length,
            sent: 0,
            failed: 0,
            errors: [] as { email: string; error: string }[],
        };

        for (const reg of registrations) {
            try {
                await sendConfirmationEmail({
                    to: reg.registrant.email,
                    studentName: reg.registrant.fullName,
                    eventTitle: event.title,
                    eventDate,
                    eventVenue,
                    qrToken: reg.qrToken,
                    translations: {
                        subject: t("subject"),
                        greeting: t("greeting"),
                        body: t("body"),
                        eventDetails: t("eventDetails"),
                        dateLabel: t("dateLabel"),
                        venueLabel: t("venueLabel"),
                        qrInstructions: t("qrInstructions"),
                        openPass: t("openPass"),
                        proTipTitle: t("proTipTitle"),
                        proTipBody: t("proTipBody"),
                        seeYou: t("seeYou"),
                        youreIn: t("youreIn"),
                        registrationConfirmed: t("registrationConfirmed"),
                        yourEntryPass: t("yourEntryPass"),
                    },
                });

                // Log the resend
                await prisma.messageLog.create({
                    data: {
                        eventId,
                        registrationId: reg.id,
                        channel: "EMAIL",
                        templateName: "confirmation_resend_correction",
                        status: "SENT",
                        sentAt: new Date(),
                    },
                });

                results.sent++;
            } catch (err) {
                results.failed++;
                results.errors.push({
                    email: reg.registrant.email,
                    error: err instanceof Error ? err.message : "Unknown error",
                });
            }

            // Throttle: 100ms between emails to respect Resend rate limits
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return NextResponse.json({
            success: true,
            eventTitle: event.title,
            correctedDate: eventDate,
            correctedVenue: eventVenue,
            timezone: timeZone,
            ...results,
        });
    } catch (error) {
        console.error("Bulk resend error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
