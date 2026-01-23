import { setRequestLocale } from 'next-intl/server';
import React from 'react';
import { ChevronDown } from 'lucide-react';

export default async function FAQPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const faqs = [
        {
            question: "How do I apply to a university through Sit Connect?",
            answer: "Applying is simple! Browse our list of partner universities, select the program you are interested in, and click 'Apply Now'. Our guided form will take you through the necessary steps."
        },
        {
            question: "Is Sit Connect free for students?",
            answer: "Yes! Our platform is completely free for students. We are funded by our partner institutions to help them find talented students like you."
        },
        {
            question: "What documents do I need for admission?",
            answer: "Typically, you will need your high school transcript (or university transcript for postgraduate), a valid passport, and language proficiency test scores. Specific requirements vary by university."
        },
        {
            question: "Can I get a scholarship?",
            answer: "Many of our partner universities offer scholarships based on academic merit. You can filter our university list to see scholarship opportunities."
        },
        {
            question: "How long does the process take?",
            answer: "After submitting your application, universities usually respond within 2-4 weeks. Our team will keep you updated every step of the way."
        },
        {
            question: "Do you help with visa applications?",
            answer: "We provide guidance and required documentation (like acceptance letters) to support your visa application, but the visa process is handled by the respective embassy."
        }
    ];

    return (
        <div className="container mx-auto px-4 py-24 max-w-3xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-display mb-4">Frequently Asked Questions</h1>
                <p className="text-muted-foreground text-lg">
                    Have questions? We're here to help.
                </p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="border border-border rounded-lg overflow-hidden">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-4 bg-card hover:bg-muted/50 transition-colors">
                                <h2 className="font-medium text-lg">{faq.question}</h2>
                                <ChevronDown className="w-5 h-5 transition-transform group-open:-rotate-180 text-muted-foreground" />
                            </summary>
                            <div className="px-4 pb-4 pt-2 text-muted-foreground leading-relaxed bg-card">
                                {faq.answer}
                            </div>
                        </details>
                    </div>
                ))}
            </div>
        </div>
    );
}
