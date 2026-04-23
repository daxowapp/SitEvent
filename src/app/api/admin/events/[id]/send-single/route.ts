import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendConfirmationEmail, sendReminderEmail } from "@/lib/email";
import { formatInTimeZone } from "date-fns-tz";
import { differenceInDays, differenceInHours } from "date-fns";
import { getTranslations } from "next-intl/server";

/**
 * POST /api/admin/events/[id]/send-single
 * 
 * Send a confirmation or reminder email to a single registrant.
 * 
 * Body:
 * - email: string (required) — registrant's email
 * - type: "confirmation" | "reminder" (required)
 * - customMessage: string (optional) — custom reminder text
 * - locale: string (optional, default "en")
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: eventId } = await params;
        const body = await request.json();
        const { email, type, customMessage, locale = "en" } = body;

        if (!email || !type) {
            return NextResponse.json(
                { error: "email and type are required" },
                { status: 400 }
            );
        }

        // 1. Fetch event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 2. Find registration
        const registration = await prisma.registration.findFirst({
            where: {
                eventId,
                registrant: { email },
            },
            include: { registrant: true },
        });

        if (!registration) {
            return NextResponse.json(
                { error: `No registration found for ${email} at this event` },
                { status: 404 }
            );
        }

        // 3. Prepare timezone-correct date
        const timeZone = event.timezone || "UTC";
        const eventStart = new Date(event.startDateTime);
        const eventDate = `${formatInTimeZone(eventStart, timeZone, "PPP")} ${formatInTimeZone(eventStart, timeZone, "h:mm a")}`;
        const eventVenue = `${event.venueName}, ${event.city || ""}`;

        // 4. Send based on type
        if (type === "confirmation") {
            const t = await getTranslations({ locale, namespace: "email.confirmation" });

            const result = await sendConfirmationEmail({
                to: registration.registrant.email,
                studentName: registration.registrant.fullName,
                eventTitle: event.title,
                eventDate,
                eventVenue,
                qrToken: registration.qrToken,
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

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || "Failed to send" },
                    { status: 500 }
                );
            }

            await prisma.messageLog.create({
                data: {
                    eventId,
                    registrationId: registration.id,
                    channel: "EMAIL",
                    templateName: "confirmation_single_resend",
                    status: "SENT",
                    sentAt: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                sent: 1,
                total: 1,
                failed: 0,
                email: registration.registrant.email,
                type: "confirmation",
            });
        } else if (type === "reminder") {
            const now = new Date();
            const daysUntil = differenceInDays(eventStart, now);
            const hoursUntil = differenceInHours(eventStart, now);

            let reminderType = customMessage;
            if (!reminderType) {
                if (daysUntil >= 2) reminderType = `${daysUntil} days`;
                else if (hoursUntil >= 2) reminderType = `${hoursUntil} hours`;
                else reminderType = "a few hours";
            }

            const result = await sendReminderEmail({
                to: registration.registrant.email,
                studentName: registration.registrant.fullName,
                eventTitle: event.title,
                eventDate,
                eventVenue,
                reminderType,
                qrToken: registration.qrToken,
            });

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || "Failed to send" },
                    { status: 500 }
                );
            }

            await prisma.messageLog.create({
                data: {
                    eventId,
                    registrationId: registration.id,
                    channel: "EMAIL",
                    templateName: `reminder_single_${reminderType.replace(/\s/g, "_")}`,
                    status: "SENT",
                    sentAt: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                sent: 1,
                total: 1,
                failed: 0,
                email: registration.registrant.email,
                type: "reminder",
                reminderType,
            });
        }

        return NextResponse.json({ error: "Invalid type. Use 'confirmation' or 'reminder'." }, { status: 400 });
    } catch (error) {
        console.error("Single send error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
