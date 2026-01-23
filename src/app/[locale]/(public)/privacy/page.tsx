import { getTranslations, setRequestLocale } from 'next-intl/server';
import React from 'react';

export default async function PrivacyPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="container mx-auto px-4 py-24 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
                <p>Welcome to Sit Connect. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. The Data We Collect</h2>
                <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                    <li><strong>Contact Data</strong> includes billing address, email address and telephone numbers.</li>
                    <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Personal Data</h2>
                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                    <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                    <li>Where we need to comply with a legal obligation.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Contact Us</h2>
                <p>If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:Mahmoud@sitconnect.net" className="text-primary hover:underline">Mahmoud@sitconnect.net</a></p>
            </div>
        </div>
    );
}
