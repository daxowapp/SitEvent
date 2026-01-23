import { setRequestLocale } from 'next-intl/server';
import React from 'react';
import Image from 'next/image';

export default async function AboutPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="bg-background min-h-screen">
            {/* Hero Section */}
            <section className="relative py-24 bg-secondary/30 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <span className="text-accent font-bold tracking-wider uppercase text-sm mb-4 block">Our Story</span>
                        <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
                            Bridging the Gap Between Talent and Opportunity
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Sit Connect is the premier platform connecting ambitious students with world-class universities in Turkey and beyond. We believe education knows no borders.
                        </p>
                    </div>
                </div>
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-accent rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute left-0 bottom-0 w-64 h-64 bg-primary rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-display font-bold mb-6">Our Mission</h2>
                            <p className="text-muted-foreground mb-6 text-lg">
                                To empower students worldwide by providing seamless access to quality higher education. We strive to simplify the complex process of university admissions through technology and personal guidance.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent" />
                                    <span>Simplifying University Applications</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent" />
                                    <span>Connecting Global Talent</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent" />
                                    <span>Fostering International Exchange</span>
                                </li>
                            </ul>
                        </div>
                        <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                            {/* Placeholder for About Image - using a gradient for now if no image available, or generic placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <span className="text-foreground/20 font-display text-4xl font-bold">Sit Connect Team</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 bg-background border-y border-border">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-primary mb-2">50+</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wide">Partner Universities</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-primary mb-2">10k+</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wide">Students Helped</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-primary mb-2">15+</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wide">Countries</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wide">Support</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
