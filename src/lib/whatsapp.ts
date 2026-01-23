
import twilio from "twilio";
import { getQrUrl } from "./qr";

interface SendWhatsAppConfirmationParams {
    to: string; // E.164 format e.g., +905551234567
    studentName: string;
    eventTitle: string;
    eventDate: string;
    qrToken: string;
    templateName?: string;
    language?: string;
}

/**
 * Send WhatsApp confirmation message using Twilio
 */
export async function sendWhatsAppConfirmation(
    params: SendWhatsAppConfirmationParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const { to, studentName, eventTitle, eventDate, qrToken, language = "en" } = params;

        const qrUrl = getQrUrl(qrToken);

        // Check for n8n Webhook URL prioritization
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
        if (n8nWebhookUrl) {
            console.log("Delegating WhatsApp message to n8n Webhook:", n8nWebhookUrl);
            try {
                const response = await fetch(n8nWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ to, studentName, eventTitle, eventDate, qrUrl, language }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Status ${response.status}: ${text}`);
                }

                return { success: true, messageId: "n8n-queued" };
            } catch (err) {
                console.error("n8n Webhook failed:", err);
                return { success: false, error: err instanceof Error ? err.message : "n8n Webhook failed" };
            }
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            console.warn("Twilio WhatsApp not configured (and no n8n webhook), skipping...");
            return { success: false, error: "Twilio WhatsApp not configured" };
        }

        const client = twilio(accountSid, authToken);

        // Twilio requires "whatsapp:" prefix for both 'to' and 'from' numbers
        // Ensure 'to' number has + but no spaces/dashes, and add 'whatsapp:' prefix
        const cleanTo = to.replace(/[^\d+]/g, '');
        const whatsappTo = `whatsapp:${cleanTo}`;
        const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

        // Construct the message body manually for now (simplest for Sandbox/Production migration)
        // In production, you might want to use Content API (Templates)

        let body = "";

        // Simple localization based on the language param
        if (language === 'ar') {
            body = `مرحباً ${studentName}! 👋\n\nتم تأكيد تسجيلك في ${eventTitle} بتاريخ ${eventDate}! ✅\n\nاضغط هنا لفتح بطاقة الدخول: ${qrUrl}\n\nنراك هناك! 🎉`;
        } else {
            body = `Hi ${studentName}! 👋\n\nYour registration for ${eventTitle} on ${eventDate} is confirmed! ✅\n\nAccess your entry pass here: ${qrUrl}\n\nSee you there! 🎉`;
        }

        const message = await client.messages.create({
            body: body,
            from: whatsappFrom,
            to: whatsappTo
        });

        console.log("Twilio Message Sent:", message.sid);

        return {
            success: true,
            messageId: message.sid,
        };
    } catch (error) {
        console.error("Failed to send WhatsApp message via Twilio:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
