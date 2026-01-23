import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";

export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="container mx-auto px-6 md:px-12 py-16 max-w-4xl">
                <h1 className="text-4xl font-bold mb-8 text-gray-900">Privacy Policy</h1>

                <div className="prose prose-gray max-w-none">
                    <p className="text-gray-600 mb-8">
                        Last updated: January 22, 2026
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Information We Collect</h2>
                        <p className="text-gray-600 mb-4">
                            When you register for our education events, we collect the following information:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Full name</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>Country and city of residence</li>
                            <li>Educational background and preferences</li>
                            <li>Event registration and attendance records</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. How We Use Your Information</h2>
                        <p className="text-gray-600 mb-4">
                            We use your personal information to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Process your event registrations</li>
                            <li>Send confirmation emails and QR codes for event check-in</li>
                            <li>Provide event updates and reminders</li>
                            <li>Connect you with universities that match your interests</li>
                            <li>Improve our services and event experiences</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Information Sharing</h2>
                        <p className="text-gray-600 mb-4">
                            We may share your information with:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Partner universities participating in events you have registered for</li>
                            <li>Service providers who assist us in operating our platform</li>
                            <li>Legal authorities when required by law</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            We do not sell your personal information to third parties.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Data Security</h2>
                        <p className="text-gray-600">
                            We implement appropriate technical and organizational measures to protect your personal
                            information against unauthorized access, alteration, disclosure, or destruction. This
                            includes encrypted data transmission, secure servers, and access controls.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Your Rights</h2>
                        <p className="text-gray-600 mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Access the personal data we hold about you</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your data</li>
                            <li>Withdraw consent for marketing communications</li>
                            <li>Request data portability</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Cookies</h2>
                        <p className="text-gray-600">
                            We use cookies and similar technologies to enhance your experience on our platform.
                            These help us understand how you use our services and enable certain features like
                            remembering your preferences. You can control cookie settings through your browser.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Third-Party Services</h2>
                        <p className="text-gray-600">
                            Our platform may contain links to third-party websites and services. We are not
                            responsible for the privacy practices of these external sites. We encourage you to
                            review their privacy policies.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Children's Privacy</h2>
                        <p className="text-gray-600">
                            Our services are intended for users who are at least 16 years old. We do not knowingly
                            collect information from children under 16. If we learn that we have collected personal
                            information from a child under 16, we will delete that information.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Changes to This Policy</h2>
                        <p className="text-gray-600">
                            We may update this privacy policy from time to time. We will notify you of any changes
                            by posting the new policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Contact Us</h2>
                        <p className="text-gray-600">
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-700 font-medium">SITCONNECT</p>
                            <p className="text-gray-600">Email: info@sitconnect.net</p>
                            <p className="text-gray-600">Phone: +90 554 308 1000</p>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
