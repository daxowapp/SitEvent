/**
 * Email Test Script - Send to specific address
 * Run with: npx tsx scripts/test-email-real.ts
 */
import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    console.log("📧 Sending test email to ahmed@daxow.com...");
    console.log("From:", process.env.RESEND_FROM_EMAIL);

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "Events Team <onboarding@resend.dev>",
            to: "ahmed@daxow.com",
            subject: "🎫 Test: Your Entry Pass for Education Fair",
            html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #E30A17 0%, #B30000 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Test Email ✅</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>Hi Ahmed,</p>
            <p>If you receive this email, delivery is working correctly!</p>
            <p style="color: #666; font-size: 14px;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            return;
        }

        console.log("✅ Email sent successfully!");
        console.log("📧 Message ID:", data?.id);
    } catch (err) {
        console.error("❌ Exception:", err);
    }
}

testEmail();
