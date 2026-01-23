"use client";

import { Search, UserPlus, QrCode, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const HowItWorks = () => {
    const t = useTranslations('home.howItWorks');

    const steps = [
        {
            icon: Search,
            step: "01",
            title: t('step1.title'),
            description: t('step1.desc'),
        },
        {
            icon: UserPlus,
            step: "02",
            title: t('step2.title'),
            description: t('step2.desc'),
        },
        {
            icon: QrCode,
            step: "03",
            title: t('step3.title'),
            description: t('step3.desc'),
        },
        {
            icon: CheckCircle,
            step: "04",
            title: t('step4.title'),
            description: t('step4.desc'),
        },
    ];

    return (
        <section id="how-it-works" className="py-20 bg-secondary/50">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
                        {t('simpleProcess')}
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <div key={step.step} className="relative">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
                            )}

                            <div className="relative bg-card rounded-2xl p-6 text-center card-elevated border border-border h-full">
                                {/* Step Number */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                                    {t('step')} {step.step}
                                </div>

                                {/* Icon */}
                                <div className="w-16 h-16 mx-auto mb-5 mt-2 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <step.icon className="w-8 h-8 text-primary" />
                                </div>

                                {/* Content */}
                                <h3 className="font-display text-xl font-bold text-card-foreground mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust Note */}
                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-3 bg-success/10 border border-success/20 rounded-full px-6 py-3">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="text-success font-medium">{t('trustNote')}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
