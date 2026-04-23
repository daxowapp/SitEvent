"use server";

import { prisma } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { formatInTimeZone } from "date-fns-tz";

export async function resendTicket(email: string) {
    if (!email) return { success: false, error: "Email is required" };

    try {
        // Find latest registration for a future or ongoing event
        const registration = await prisma.registration.findFirst({
            where: {
                registrant: {
                    email: email
                },
                event: {
                    endDateTime: {
                        gte: new Date()
                    }
                }
            },
            include: {
                event: true,
                registrant: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!registration) {
            return { success: false, error: "No active event registration found for this email." };
        }

        const timeZone = registration.event.timezone || "UTC";

        // Resend email
        await sendConfirmationEmail({
            to: registration.registrant.email,
            studentName: registration.registrant.fullName,
            eventTitle: registration.event.title,
            eventDate: `${formatInTimeZone(new Date(registration.event.startDateTime), timeZone, "PPP")} ${formatInTimeZone(new Date(registration.event.startDateTime), timeZone, "h:mm a")}`,
            eventVenue: registration.event.venueAddress || registration.event.venueName || "TBA",
            qrToken: registration.qrToken,
            translations: {
                // Hardcoded defaults for recovery, ideally fetch from template or locale
                subject: "Your Event Ticket (Resuffeled)",
                greeting: "Hi {name},",
                body: "Here is your requested ticket for {eventName}.",
                eventDetails: "Event Details",
                dateLabel: "Date",
                venueLabel: "Venue",
                qrInstructions: "Show this at entrance",
                openPass: "Open Ticket",
                proTipTitle: "Lost your ticket?",
                proTipBody: "We resent this to you because you requested it. Keep it safe!",
                seeYou: "See you there!",
                youreIn: "Ticket Recovery",
                registrationConfirmed: "Ticket Found",
                yourEntryPass: "Your Entry QR"
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Resend ticket error:", error);
        return { success: false, error: "Failed to send email. Please try again." };
    }
}
