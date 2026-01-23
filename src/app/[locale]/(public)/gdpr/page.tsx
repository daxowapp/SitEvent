import { setRequestLocale } from 'next-intl/server';
import React from 'react';

export default async function GDPRPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="container mx-auto px-4 py-24 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">GDPR Compliance</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="mb-4 text-muted-foreground">Effective Date: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. General Data Protection Regulation (GDPR)</h2>
                <p>Sit Connect is committed to ensuring that your privacy is protected and we strictly adhere to the provisions of all relevant Data Protection Legislation, including GDPR, ensuring all personal data is handled in line with the principles outlined in the regulation.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. Your Rights Under GDPR</h2>
                <p>Under the GDPR, you have the following rights regarding your personal data:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li><strong>Right to Access:</strong> You have the right to request a copy of the information that we hold about you.</li>
                    <li><strong>Right to Rectification:</strong> You have the right to correct data that we hold about you that is inaccurate or incomplete.</li>
                    <li><strong>Right to be Forgotten:</strong> You can ask for the data we hold about you to be erased from our records.</li>
                    <li><strong>Right to Restriction of Processing:</strong> You have the right to restrict the processing of your personal data.</li>
                    <li><strong>Right to Object:</strong> You have the right to object to certain types of processing such as direct marketing.</li>
                    <li><strong>Right to Data Portability:</strong> You have the right to have the data we hold about you transferred to another organization.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Controller</h2>
                <p>For the purpose of the GDPR, the data controller is Sit Connect.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Contact Information</h2>
                <p>If you wish to exercise any of your rights or have any questions regarding our GDPR compliance, please contact our Data Protection Officer at: <a href="mailto:Mahmoud@sitconnect.net" className="text-primary hover:underline">Mahmoud@sitconnect.net</a></p>
            </div>
        </div>
    );
}
