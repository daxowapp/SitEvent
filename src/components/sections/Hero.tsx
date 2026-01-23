"use client";

import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

interface HeroProps {
    initialQuery?: string;
    popularSearchTerms?: string[];
}

const Hero = ({ initialQuery = "", popularSearchTerms = [] }: HeroProps) => {
    const t = useTranslations('home.hero');
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const router = useRouter();
    const pathname = usePathname();

    // Use dynamic terms or fallback
    const countries = popularSearchTerms.length > 0
        ? popularSearchTerms.slice(0, 5) // Limit to 5
        : ["Türkiye", "Germany", "UK", "USA", "Netherlands"];

    const handleSearch = (term: string) => {
        // Construct new URL with search param
        // We use the router to navigate, which will trigger a server re-render
        // We keep the hash #events to scroll down to results
        router.push(`${pathname}?q=${encodeURIComponent(term)}#events`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch(searchQuery);
        }
    };

    return (
        <section className="relative min-h-[90vh] hero-gradient overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 pattern-dots opacity-30" />

            {/* Decorative Elements */}
            <div className="absolute top-20 right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-8 animate-fade-up">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        <span className="text-primary-foreground/90 text-sm font-medium">
                            {t('badge')}
                        </span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                        {t.rich('title', {
                            span: (chunks) => <span className="text-gradient">{chunks}</span>
                        })}
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.2s" }}>
                        {t('subtitle')}
                    </p>

                    {/* Search Box */}
                    <div className="bg-background rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.3s" }}>
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={t('searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <Button
                                variant="accent"
                                size="lg"
                                className="h-12 px-8"
                                onClick={() => handleSearch(searchQuery)}
                            >
                                <Search className="w-5 h-5 mr-2" />
                                {t('findEvents')}
                            </Button>
                        </div>

                        {/* Quick Links */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pb-2">
                            <span className="text-sm text-muted-foreground">{t('popular')}:</span>
                            {countries.map((country) => (
                                <button
                                    key={country}
                                    onClick={() => handleSearch(country)}
                                    className="text-sm text-primary hover:text-accent font-medium transition-colors px-2 py-1 rounded-md hover:bg-secondary"
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 mt-8 pb-12 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "0.4s" }}>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">50+</div>
                            <div className="text-sm text-primary-foreground/70">{t('stats.unis')}</div>
                        </div>
                        <div className="text-center border-x border-primary-foreground/20">
                            <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">15K+</div>
                            <div className="text-sm text-primary-foreground/70">{t('stats.students')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">8</div>
                            <div className="text-sm text-primary-foreground/70">{t('stats.years')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wave Bottom */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                    <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 60 120H0Z" fill="hsl(var(--background))" />
                </svg>
            </div>
        </section>
    );
};

export default Hero;
