"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const partnerLogos = [
    "University of Amsterdam",
    "TU Munich",
    "Imperial College",
    "ETH Zurich",
    "Sciences Po",
    "KU Leuven",
];

interface UniversitiesSectionProps {
    universities?: { id?: string; name: string; logoUrl?: string | null }[];
}

const UniversitiesSection = ({ universities }: UniversitiesSectionProps) => {
    const t = useTranslations('home.universities'); // Updated namespace from recruit to home.universities

    // Fallback if no dynamic data
    const displayUniversities = universities && universities.length > 0
        ? universities
        : partnerLogos.map(name => ({ id: undefined, name, logoUrl: null }));

    return (
        <section id="universities" className="py-20 bg-background">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div>
                        <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
                            {t('badge')}
                        </span>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                            {t('title')}
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            {t('subtitle')}
                        </p>

                        {/* Benefits - Hardcoded for now to match design strictly, or map */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            {/* We can map this later, sticking to visual match first */}
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button variant="accent" size="lg" asChild>
                                <Link href="/recruit">
                                    {t('ctaInfo')}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>

                        </div>
                    </div>

                    {/* Partner Logos / Trust */}
                    <div className="bg-secondary/50 rounded-3xl p-8 lg:p-10">
                        <h3 className="font-display text-xl font-bold text-foreground mb-6 text-center">
                            {t('trustedBy')}
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {displayUniversities.map((uni, idx) => (
                                <Link
                                    key={uni.name + idx}
                                    href={uni.id ? `/university/${uni.id}` : '#'}
                                    className={cn(
                                        "bg-card rounded-xl p-4 text-center border border-border hover:border-primary/30 transition-colors flex items-center justify-center flex-col gap-2 h-full min-h-[100px]",
                                        !uni.id && "pointer-events-none"
                                    )}
                                >
                                    {uni.logoUrl ? (
                                        <div className="w-full h-12 relative flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={uni.logoUrl}
                                                alt={uni.name}
                                                className="max-w-full max-h-full object-contain opacity-90"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Building2 className="w-6 h-6 text-primary" />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-foreground line-clamp-2">{uni.name}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <div className="flex items-center gap-2 text-success mb-4">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-semibold">{t('benefitsTitle')}</span>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    {t('benefits.attendees')}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    {t('benefits.marketing')}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    {t('benefits.leads')}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    {t('benefits.support')}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UniversitiesSection;
