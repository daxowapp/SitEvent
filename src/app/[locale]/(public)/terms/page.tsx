import { setRequestLocale } from 'next-intl/server';
import React from 'react';

export default async function TermsPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="container mx-auto px-4 py-24 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
                <p>By accessing our website at Sit Connect, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use License</h2>
                <p>Permission is granted to temporarily download one copy of the materials (information or software) on Sit Connect's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>Modify or copy the materials;</li>
                    <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                    <li>Attempt to decompile or reverse engineer any software contained on Sit Connect's website;</li>
                    <li>Remove any copyright or other proprietary notations from the materials; or</li>
                    <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. Disclaimer</h2>
                <p>The materials on Sit Connect's website are provided on an 'as is' basis. Sit Connect makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitations</h2>
                <p>In no event shall Sit Connect or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Sit Connect's website, even if Sit Connect or a Sit Connect authorized representative has been notified orally or in writing of the possibility of such damage.</p>
            </div>
        </div>
    );
}
