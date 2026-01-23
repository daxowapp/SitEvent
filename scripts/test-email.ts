/**
 * Email Test Script
 * Run with: npx tsx scripts/test-email.ts
 */
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_5Vgi6tkf_5uvttzxuwuScumk4cnXVTtKv");

async function testEmail() {
    console.log("🧪 Testing Resend Email API...");
    console.log("API Key (first 10 chars):", (process.env.RESEND_API_KEY || "re_5Vgi6tkf_5uvttzxuwuScumk4cnXVTtKv").substring(0, 10) + "...");

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "Events Team <onboarding@resend.dev>",
            to: "delivered@resend.dev", // Resend's test email address that always succeeds
            subject: "🧪 Test Email from Events App",
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1>Test Email ✅</h1>
          <p>If you see this, the Resend API is working correctly!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
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
