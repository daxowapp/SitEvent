// Simple email test - run with: node --env-file=.env scripts/send-test.mjs
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('📧 Sending test email to ahmed@daxow.com...');
console.log('API Key:', process.env.RESEND_API_KEY ? 'Set ✓' : 'Missing ✗');
console.log('From:', process.env.RESEND_FROM_EMAIL);

const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: 'ahmed@daxow.com',
    subject: '🎫 Test: Your Entry Pass for Education Fair',
    html: '<div style="font-family:sans-serif;padding:20px"><h1 style="color:#E30A17">Test Email ✅</h1><p>If you receive this, email delivery is working!</p><p>Timestamp: ' + new Date().toISOString() + '</p></div>',
});

if (error) {
    console.error('❌ Error:', JSON.stringify(error, null, 2));
} else {
    console.log('✅ Success! Message ID:', data?.id);
}
