
import twilio from "twilio";
import fs from 'fs';
import path from 'path';

async function verify() {
    console.log("Reading .env file...");
    const envPath = path.join(process.cwd(), '.env');

    // Manually parse for the script
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const sidMatch = envContent.match(/TWILIO_ACCOUNT_SID="?([^"\n]+)"?/);
    const tokenMatch = envContent.match(/TWILIO_AUTH_TOKEN="?([^"\n]+)"?/);
    const apiKeyMatch = envContent.match(/TWILIO_API_KEY="?([^"\n]+)"?/);
    const apiSecretMatch = envContent.match(/TWILIO_API_SECRET="?([^"\n]+)"?/);
    const fromMatch = envContent.match(/TWILIO_WHATSAPP_NUMBER="?([^"\n]+)"?/);

    const n8nMatch = envContent.match(/N8N_WEBHOOK_URL=\"?([^\"\\n]+)\"?/);
    const n8nWebhookUrl = n8nMatch ? n8nMatch[1] : null;

    if (n8nWebhookUrl) {
        console.log(`\nFound n8n Webhook URL: ${n8nWebhookUrl}`);
        console.log("Attempting to send via n8n...");

        try {
            const response = await fetch(n8nWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: "whatsapp:+905492006060",
                    studentName: "Test Student",
                    eventTitle: "Test Event",
                    eventDate: "2024-01-01",
                    qrUrl: "https://example.com/qr",
                    language: "en"
                }),
            });

            if (response.ok) {
                console.log("✅ SUCCESS: n8n Webhook triggered!");
                return;
            } else {
                console.error(`❌ FAILED: n8n returned ${response.status} ${await response.text()}`);
                // Proceed to test Twilio direct if n8n fails? 
                // Or stop? Let's just log and continue to Twilio check so user verifies both.
                console.log("Falling back to check direct Twilio configuration...");
            }
        } catch (e) {
            console.error("❌ FAILED: Could not reach n8n webhook.", e);
            console.log("Falling back to check direct Twilio configuration...");
        }
    } else {
        console.log("No N8N_WEBHOOK_URL found in .env, skipping n8n check.");
    }

    const accountSid = sidMatch ? sidMatch[1] : null;
    const authToken = tokenMatch ? tokenMatch[1] : null;
    const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;
    const apiSecret = apiSecretMatch ? apiSecretMatch[1] : null;
    const fromNumber = fromMatch ? fromMatch[1] : null;

    if (!accountSid || !fromNumber) {
        console.error("❌ Twilio configuration incomplete (Missing SID or Number)");
        return;
    }

    console.log(`Twilio SID: ${accountSid.substring(0, 6)}...`);

    let client;
    if (apiKey && apiSecret) {
        console.log("Using API Key Authentication...");
        client = twilio(apiKey, apiSecret, { accountSid: accountSid });
    } else if (authToken) {
        console.log("Using Auth Token Authentication...");
        client = twilio(accountSid, authToken);
    } else {
        console.error("❌ Missing valid Auth Token or API Key");
        return;
    }

    const to = "whatsapp:+905492006060"; // Test number

    // Ensure "whatsapp:" prefix
    const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

    console.log(`Sending from ${whatsappFrom} to ${to}...`);

    try {
        const message = await client.messages.create({
            body: "🔔 Hello! This is a test message from Sit Connect via Twilio. 🎉",
            from: whatsappFrom,
            to: to
        });

        console.log("\n✅ SUCCESS: Message sent!");
        console.log("Message SID:", message.sid);
        console.log("Status:", message.status);

    } catch (error: any) {
        console.error("\n❌ FAILED: Twilio API error.");
        console.error(error.message);
        if (error.code === 63015) {
            console.error("👉 TIP: If using Sandbox, you must send 'join <keyword>' from your phone to the Sandbox number first!");
        }
    }
}

verify();
