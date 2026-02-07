"use server";

import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { sendConfirmationEmail } from "@/lib/email";
import { sendWhatsAppConfirmation } from "@/lib/whatsapp";

export async function recoverTicketKiosk(emailOrPhone: string, eventId: string) {
    if (!emailOrPhone) return { success: false, error: "Email or Phone is required" };

    try {
        // Find registration by email OR phone for the specific event
        const registration = await prisma.registration.findFirst({
            where: {
                eventId: eventId,
                registrant: {
                    OR: [
                        { email: emailOrPhone },
                        { phone: emailOrPhone }
                    ]
                }
            },
            include: {
                registrant: true,
                event: true
            }
        });

        if (!registration) {
            return { success: false, error: "No registration found for this event." };
        }

        // Resend confirmation (Async)
        // We do this to ensure they have it on their phone too
        const eventDate = format(new Date(registration.event.startDateTime), "PPP");
        const eventVenue = registration.event.venueName || registration.event.city || "TBA";

        // Fire and forget email/whatsapp
        sendConfirmationEmail({
            to: registration.registrant.email,
            studentName: registration.registrant.fullName,
            eventTitle: registration.event.title,
            eventDate: eventDate,
            eventVenue: eventVenue,
            qrToken: registration.qrToken,
            translations: {
                subject: "Your Event Ticket (Resect)",
                greeting: `Hi ${registration.registrant.fullName},`,
                body: "Here is your requested ticket.",
                eventDetails: "Event Details",
                dateLabel: "Date",
                venueLabel: "Venue",
                qrInstructions: "Show this at entrance",
                openPass: "Open Ticket",
                proTipTitle: "Lost your ticket?",
                proTipBody: "We resent this to you.",
                seeYou: "See you there!",
                youreIn: "Ticket Recovery",
                registrationConfirmed: "Ticket Found",
                yourEntryPass: "Your Entry QR"
            }
        }).catch(console.error);

        if (registration.registrant.phone) {
             sendWhatsAppConfirmation({
                to: registration.registrant.phone,
                studentName: registration.registrant.fullName,
                eventTitle: registration.event.title,
                eventDate: eventDate,
                qrToken: registration.qrToken,
                language: 'en' // Default to EN for now
            }).catch(console.error);
        }

        return { 
            success: true, 
            qrToken: registration.qrToken,
            studentName: registration.registrant.fullName
        };
    } catch (error) {
        console.error("Kiosk recovery error:", error);
        return { success: false, error: "System error. Please ask clear staff." };
    }
}
