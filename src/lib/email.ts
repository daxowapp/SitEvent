import { Resend } from 'resend';
import { generateQrBuffer, getQrUrl } from "./qr";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || "re_5Vgi6tkf_5uvttzxuwuScumk4cnXVTtKv");

interface ConfirmationEmailTranslations {
  subject: string;
  greeting: string;
  body: string;
  eventDetails: string;
  dateLabel: string;
  venueLabel: string;
  qrInstructions: string;
  openPass: string;
  proTipTitle: string;
  proTipBody: string;
  seeYou: string;
  youreIn: string;
  registrationConfirmed: string;
  yourEntryPass: string;
}

interface SendConfirmationEmailParams {
  to: string;
  studentName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  qrToken: string;
  translations: ConfirmationEmailTranslations;
}

/**
 * Send registration confirmation email with QR code
 */
export async function sendConfirmationEmail(
  params: SendConfirmationEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { to, studentName, eventTitle, eventDate, eventVenue, qrToken, translations } = params;

    // Generate QR code as attachment
    const qrBuffer = await generateQrBuffer(qrToken);
    const qrUrl = getQrUrl(qrToken);

    // Use translations or fallbacks (though types enforce presence)
    const t = translations;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Events Team <onboarding@resend.dev>",
      to,
      subject: t.subject.replace("{eventName}", eventTitle),
      html: `
        <!DOCTYPE html>
        <html dir="${t.greeting.includes('مرحباً') ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f8; color: #333;">
          
          <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #E30A17 0%, #B30000 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Sit Connect</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">${t.youreIn} 🎉</p>
            </div>
            
            <div style="padding: 32px 24px;">
              <p style="font-size: 16px; margin-bottom: 24px;">${t.greeting.replace("{name}", `<strong>${studentName}</strong>`)}</p>
              
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                ${t.body.replace("{eventName}", `<strong>${eventTitle}</strong>`)}
              </p>
              
              <!-- Core Action: QR Code -->
              <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                <p style="margin: 0 0 16px; font-weight: 600; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${t.yourEntryPass}</p>
                
                <img src="cid:qrcode" alt="QR Code" style="display: inline-block; max-width: 180px; height: auto; border-radius: 8px;"/>
                
                <div style="margin-top: 16px;">
                  <a href="${qrUrl}" style="display: inline-block; background-color: #E30A17; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">${t.openPass}</a>
                </div>
              </div>

              <!-- Event Details -->
              <div style="margin-bottom: 32px;">
                <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; color: #1e293b;">${t.eventDetails}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 30%;">📅 ${t.dateLabel}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #333;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">📍 ${t.venueLabel}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #333;">${eventVenue}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #fff1f2; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px; color: #9f1239; font-size: 16px;">${t.proTipTitle}</h4>
                <p style="margin: 0; color: #881337; font-size: 14px; line-height: 1.5;">
                  ${t.proTipBody}
                </p>
              </div>

              <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 40px; margin-bottom: 0;">
                ${t.seeYou} <br>The SitConnect Team
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
             <p style="color: #94a3b8; font-size: 12px;">© 2026 SitConnect Events. All rights reserved.</p>
             <p style="color: #cbd5e1; font-size: 11px; margin-top: 8px;">Powered by <strong>Fuar inn</strong></p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          content: qrBuffer,
          filename: "qr-code.png",
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Undefined error",
    };
  }
}

interface SendReminderEmailParams {
  to: string;
  studentName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  reminderType: string; // e.g., "7 days", "1 day", "3 hours"
  qrToken: string;
}

/**
 * Send reminder email
 */
export async function sendReminderEmail(
  params: SendReminderEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { to, studentName, eventTitle, eventDate, eventVenue, reminderType, qrToken } = params;

    const qrUrl = getQrUrl(qrToken);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Events Team <onboarding@resend.dev>",
      to,
      subject: `⏰ ${eventTitle} is in ${reminderType}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f8; color: #333;">
          
          <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">⏰ Happening Soon!</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">${eventTitle} is in <strong>${reminderType}</strong>.</p>
            </div>
            
            <div style="padding: 32px 24px;">
              <p style="font-size: 16px; margin-bottom: 24px;">Hi <strong>${studentName}</strong>,</p>
              
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Just a friendly nudge! The event you registered for is coming up very soon. Here's a quick reminder of the details:
              </p>
              
              <!-- Event Details -->
              <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #0369a1; font-weight: 500;">📅 Date</td>
                    <td style="padding: 8px 0; color: #333; text-align: right;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #0369a1; font-weight: 500;">📍 Venue</td>
                    <td style="padding: 8px 0; color: #333; text-align: right;">${eventVenue}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${qrUrl}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Your QR Pass
                </a>
                <p style="color: #64748b; font-size: 13px; margin-top: 12px;">Have it ready on your phone for fast check-in.</p>
              </div>
              
              <!-- Pro Tip -->
              <div style="background-color: #fefce8; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #854d0e; font-size: 14px; line-height: 1.5;">
                  💡 <strong>Tip:</strong> Arrive a few minutes early to grab a good spot and explore the booths!
                </p>
              </div>

              <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 40px; margin-bottom: 0;">
                See you there! <br>The Events Team
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
             <p style="color: #94a3b8; font-size: 12px;">© 2026 SitConnect Events. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
