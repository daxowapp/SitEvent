"use client";

import { GraduationCap, Users, Globe, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

interface StatsSectionProps {
    countryCount?: number;
    countryList?: string[];
}

const StatsSection = ({ countryCount, countryList }: StatsSectionProps) => {
    const t = useTranslations('home.stats');

    // Format country list for display (e.g. "Türkiye, Germany, UK, and more" or just list if few)
    // Note: To fully translate this "Events across..." phrase we need to pass params to distinct keys or formatting.
    // Simplifying to use t.rich or basic replacement for now.
    const countriesNames = countryList && countryList.length > 0
        ? countryList.slice(0, 3).join(", ")
        : "Türkiye, Germany, UK";

    // We can assume t('desc.countries', {countries: ...}) handles the structure.

    const stats = [
        {
            icon: GraduationCap,
            value: "50+",
            label: t('universities'),
            description: t('desc.unis'),
        },
        {
            icon: Users,
            value: "15,000+",
            label: t('students'),
            description: t('desc.students'),
        },
        {
            icon: Globe,
            value: countryCount ? countryCount.toString() : "5",
            label: t('countries'),
            description: t('desc.countries', { countries: countriesNames }),
        },
        {
            icon: Calendar,
            value: "8",
            label: t('yearsRunning'),
            description: t('desc.years'),
        },
    ];

    return (
        <section className="py-20 hero-gradient relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 pattern-dots opacity-20" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
                        {t('trustedPlatform')}
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-2xl p-6 text-center hover:bg-primary-foreground/15 transition-colors"
                        >
                            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent/20 flex items-center justify-center">
                                <stat.icon className="w-7 h-7 text-white" />
                            </div>
                            <div className="text-4xl font-bold text-primary-foreground mb-2">
                                {stat.value}
                            </div>
                            <div className="text-primary-foreground font-semibold mb-2">
                                {stat.label}
                            </div>
                            <p className="text-sm text-primary-foreground/70">
                                {stat.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
