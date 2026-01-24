'use server';

import { exhibitorSchema, type ExhibitorFormData } from "@/lib/validations";
import { prisma } from "@/lib/db";
import { MessageChannel } from "@prisma/client";
import { sendExhibitorInquiryEmail } from "@/lib/email";

export async function submitExhibitorInquiry(eventId: string, data: ExhibitorFormData) {
    // Validate input
    const validatedFields = exhibitorSchema.safeParse(data);

    if (!validatedFields.success) {
        return { error: "Invalid form data" };
    }

    const { institutionName, contactPerson, email, phone, country, website, notes } = validatedFields.data;

    try {
        // Create a message log entry to track this inquiry
        await prisma.messageLog.create({
            data: {
                eventId,
                channel: MessageChannel.EMAIL,
                templateName: "exhibitor_inquiry",
                status: "QUEUED",
                providerMessageId: null,
                errorText: JSON.stringify({
                    type: "exhibitor_inquiry",
                    details: {
                        institutionName,
                        contactPerson,
                        email,
                        phone,
                        country,
                        website,
                        notes
                    }
                }),
            }
        });

        // Send Email Notification to Admins
        await sendExhibitorInquiryEmail({
            institutionName,
            contactPerson,
            email,
            phone,
            country,
            website: website || undefined,
            notes: notes || undefined,
            eventId
        });

        console.log("New Exhibitor Inquiry:", { eventId, ...validatedFields.data });

        return { success: true };
    } catch (error) {
        console.error("Failed to submit exhibitor inquiry:", error);
        return { error: "Failed to submit inquiry. Please try again." };
    }
}
