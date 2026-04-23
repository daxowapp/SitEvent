import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { formatInTimeZone } from "date-fns-tz";
import { differenceInDays, differenceInHours } from "date-fns";

/**
 * POST /api/admin/events/[id]/send-reminder
 * 
 * Send a bulk reminder email + optional WhatsApp to all registrants of an event.
 * 
 * Body (optional):
 * - dryRun: boolean (default false) - preview count without sending
 * - customMessage: string - optional custom reminder type text (e.g. "5 days")
 *   If omitted, auto-calculated from event date.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: eventId } = await params;

        // Parse optional body
        let dryRun = false;
        let customMessage = "";
        try {
            const body = await request.json();
            dryRun = body.dryRun || false;
            customMessage = body.customMessage || "";
        } catch {
            // No body is fine
        }

        // 1. Fetch event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 2. Calculate days until event
        const now = new Date();
        const eventStart = new Date(event.startDateTime);
        const daysUntil = differenceInDays(eventStart, now);
        const hoursUntil = differenceInHours(eventStart, now);

        if (eventStart < now) {
            return NextResponse.json({
                error: "This event has already started/passed",
                eventTitle: event.title,
                startDateTime: event.startDateTime,
            }, { status: 400 });
        }

        // Auto-generate reminder type text
        let reminderType = customMessage;
        if (!reminderType) {
            if (daysUntil >= 2) {
                reminderType = `${daysUntil} days`;
            } else if (hoursUntil >= 2) {
                reminderType = `${hoursUntil} hours`;
            } else {
                reminderType = "a few hours";
            }
        }

        // 3. Fetch all active registrations
        const registrations = await prisma.registration.findMany({
            where: {
                eventId,
                status: "REGISTERED",
            },
            include: {
                registrant: true,
            },
        });

        // 4. Prepare timezone-correct date
        const timeZone = event.timezone || "UTC";
        const eventDate = `${formatInTimeZone(eventStart, timeZone, "EEEE, MMMM d, yyyy")} at ${formatInTimeZone(eventStart, timeZone, "h:mm a")}`;
        const eventVenue = `${event.venueName}, ${event.venueAddress || ""}, ${event.city || ""}`.replace(/, ,/g, ",").replace(/,\s*$/, "");

        if (dryRun) {
            return NextResponse.json({
                dryRun: true,
                eventTitle: event.title,
                totalRegistrants: registrations.length,
                daysUntilEvent: daysUntil,
                hoursUntilEvent: hoursUntil,
                reminderType,
                eventDate,
                eventVenue,
                timezone: timeZone,
                message: `Would send "${reminderType}" reminder to ${registrations.length} registrants.`,
            });
        }

        // 5. Send reminders
        const results = {
            total: registrations.length,
            sent: 0,
            failed: 0,
            errors: [] as { email: string; error: string }[],
        };

        for (const reg of registrations) {
            try {
                // Send email reminder
                await sendReminderEmail({
                    to: reg.registrant.email,
                    studentName: reg.registrant.fullName,
                    eventTitle: event.title,
                    eventDate,
                    eventVenue,
                    reminderType,
                    qrToken: reg.qrToken,
                });

                // Log the reminder
                await prisma.messageLog.create({
                    data: {
                        eventId,
                        registrationId: reg.id,
                        channel: "EMAIL",
                        templateName: `reminder_${reminderType.replace(/\s/g, "_")}`,
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

            // Throttle: 100ms between emails
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Also send WhatsApp reminders via n8n if configured
        let whatsappSent = 0;
        if (process.env.N8N_WEBHOOK_URL) {
            const { sendWhatsAppConfirmation } = await import("@/lib/whatsapp");
            for (const reg of registrations) {
                if (reg.registrant.phone) {
                    try {
                        await sendWhatsAppConfirmation({
                            to: reg.registrant.phone,
                            studentName: reg.registrant.fullName,
                            eventTitle: event.title,
                            eventDate,
                            qrToken: reg.qrToken,
                            language: "en",
                        });
                        whatsappSent++;
                    } catch {
                        // Non-critical, continue
                    }
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
            }
        }

        return NextResponse.json({
            success: true,
            eventTitle: event.title,
            daysUntilEvent: daysUntil,
            hoursUntilEvent: hoursUntil,
            reminderType,
            correctedDate: eventDate,
            timezone: timeZone,
            email: results,
            whatsappSent,
        });
    } catch (error) {
        console.error("Bulk reminder error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
