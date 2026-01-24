import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { ExhibitorForm } from "@/components/public/exhibitor-form";
import { Check, Calendar, MapPin, Users, TrendingUp, ArrowRight, Sparkles, Globe, Target } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

async function getRecruitmentEvents() {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[project-ref]')) {
        return [];
    }
    try {
        const { prisma } = await import("@/lib/db");
        return await prisma.event.findMany({
            where: {
                status: "PUBLISHED",
                startDateTime: { gte: new Date() },
            },
            orderBy: { startDateTime: "asc" },
            select: {
                id: true,
                title: true,
                slug: true,
                startDateTime: true,
                city: true,
                country: true,
                participationFee: true,
                currency: true,
                venueName: true,
            }
        });
    } catch {
        return [];
    }
}

async function getStats() {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[project-ref]')) {
        return { leads: 50000, countries: 12, universities: 200 };
    }
    try {
        const { prisma } = await import("@/lib/db");
        const [universityCount, leadsCount, countries] = await Promise.all([
            prisma.university.count({ where: { isActive: true } }),
            prisma.registrant.count(),
            prisma.event.findMany({
                where: { status: "PUBLISHED" },
                select: { country: true },
                distinct: ['country']
            })
        ]);

        return {
            leads: leadsCount > 500 ? leadsCount : 50000,
            countries: countries.length > 3 ? countries.length : 12,
            universities: universityCount > 10 ? universityCount : 200
        };
    } catch {
        return { leads: 50000, countries: 12, universities: 200 };
    }
}

export default async function RecruitPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const [events, stats] = await Promise.all([
        getRecruitmentEvents(),
        getStats()
    ]);
    const t = await getTranslations('recruit');

    // Format numbers safely
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
    };

    return (
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
            {/* 1. Cinematic Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 overflow-hidden isolate hero-gradient">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 pattern-dots opacity-20" />
                    {/* Animated Blobs */}
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                </div>

                <div className="container relative z-10 px-6 md:px-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-md mb-8 animate-fade-in-up">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium tracking-wide text-primary-foreground uppercase">
                            {t('hero.badge')}
                        </span>
                    </div>

                    <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight leading-[1.1] animate-fade-in-up delay-100 text-primary-foreground">
                        {t.rich('hero.title', {
                            br: () => <br />,
                            span: (chunks) => <span className="text-gradient font-extrabold">{chunks}</span>
                        })}
                    </h1>

                    <p className="text-xl md:text-2xl text-primary-foreground/80 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200 font-light">
                        {t('hero.subtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-background text-foreground hover:bg-white/90 hover:text-primary shadow-xl transition-all transform hover:scale-105" asChild>
                            <a href="#inquiry">{t('hero.ctaPartner')}</a>
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground backdrop-blur-sm" asChild>
                            <a href="#schedule">{t('hero.ctaSchedule')}</a>
                        </Button>
                    </div>

                    {/* Floating Glass Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-5xl mx-auto">
                        {[
                            { label: t('stats.leads'), value: `${formatNumber(stats.leads)}+`, icon: Users },
                            { label: t('stats.countries'), value: `${stats.countries}+`, icon: Globe },
                            { label: t('stats.partners'), value: `${stats.universities}+`, icon: Target },
                            { label: t('stats.roi'), value: "Top Rated", icon: TrendingUp },
                        ].map((stat, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-md hover:bg-primary-foreground/20 transition-colors group">
                                <stat.icon className="w-6 h-6 text-primary-foreground/60 mb-3 group-hover:text-accent transition-colors" />
                                <div className="text-3xl font-display font-bold text-primary-foreground mb-1">{stat.value}</div>
                                <div className="text-sm text-primary-foreground/70 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Wave Bottom */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H0Z" fill="hsl(var(--background))" />
                    </svg>
                </div>
            </section>

            {/* 2. Bento Grid Benefits */}
            <section className="py-24 bg-background border-t border-border/50 relative">
                <div className="container mx-auto px-6 md:px-12 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">{t('benefits.title')}</h2>
                        <p className="text-muted-foreground text-lg">{t('benefits.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Large Card 1 */}
                        <div className="md:col-span-2 bg-gradient-to-br from-secondary/50 to-background p-10 rounded-3xl border border-border hover:border-primary/30 transition-all duration-500 group overflow-hidden relative shadow-sm">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Users className="w-40 h-40 text-primary" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
                                    <Target className="w-7 h-7" />
                                </div>
                                <h3 className="font-display text-2xl font-bold mb-4 text-foreground">{t('benefits.directAccess.title')}</h3>
                                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">{t('benefits.directAccess.desc')}</p>
                            </div>
                        </div>

                        {/* Tall Card */}
                        <div className="bg-primary p-10 rounded-3xl shadow-xl text-primary-foreground relative overflow-hidden group">
                            <div className="absolute inset-0 pattern-dots opacity-10" />
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-md border border-white/20">
                                        <Globe className="w-7 h-7" />
                                    </div>
                                    <h3 className="font-display text-2xl font-bold mb-4">{t('benefits.brandVisibility.title')}</h3>
                                    <p className="text-primary-foreground/80 text-lg">{t('benefits.brandVisibility.desc')}</p>
                                </div>
                                <div className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent">
                                    {t('benefits.globalReach')} <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-card p-10 rounded-3xl border border-border hover:border-primary/30 transition-all duration-500 group shadow-sm">
                            <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <h3 className="font-display text-2xl font-bold mb-4 text-foreground">{t('benefits.smartData.title')}</h3>
                            <p className="text-muted-foreground text-lg">{t('benefits.smartData.desc')}</p>
                        </div>

                        {/* Card 4 */}
                        <div className="md:col-span-2 bg-secondary/30 p-10 rounded-3xl border border-border hover:border-primary/20 transition-all duration-500 group text-foreground relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-1">
                                    <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center text-primary mb-6 border border-border shadow-sm">
                                        <Check className="w-7 h-7" />
                                    </div>
                                    <h3 className="font-display text-2xl font-bold mb-4">{t('benefits.quality.title')}</h3>
                                    <p className="text-muted-foreground text-lg">{t('benefits.quality.desc')}</p>
                                </div>
                                <div className="w-full md:w-1/3 bg-background rounded-xl p-6 border border-border shadow-sm">
                                    <div className="space-y-3">
                                        {[t('benefits.quality.tags.seniors'), t('benefits.quality.tags.gpa'), t('benefits.quality.tags.english')].map((tag, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                                                <div className="w-2 h-2 rounded-full bg-accent" />
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Modern Schedule List */}
            <section id="schedule" className="py-24 bg-secondary/10 relative">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-2 block">{t('schedule.badge')}</span>
                            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">{t('schedule.title')}</h2>
                        </div>
                        <Button variant="outline" className="rounded-full">{t('schedule.downloadCalendar')}</Button>
                    </div>

                    <div className="space-y-3">
                        {events.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground bg-background rounded-3xl border border-dashed border-border">
                                {t('schedule.noEvents')}
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="group bg-background hover:bg-white rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6 md:gap-12 shadow-sm hover:shadow-md">
                                    {/* Date */}
                                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-0 min-w-[100px]">
                                        <span className="text-primary font-medium uppercase text-sm tracking-wider">{format(new Date(event.startDateTime), "MMM yyyy")}</span>
                                        <span className="text-3xl font-display font-bold text-foreground">{format(new Date(event.startDateTime), "dd")}</span>
                                    </div>

                                    {/* Event Info */}
                                    <div className="flex-1">
                                        <h4 className="text-2xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                            {event.title}
                                        </h4>
                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" /> {event.city}, {event.country}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> {format(new Date(event.startDateTime), "EEEE")}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                                        <div className="md:text-right">
                                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('schedule.fee')}</div>
                                            <div className="font-bold text-foreground">
                                                {event.participationFee
                                                    ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency }).format(event.participationFee)}`
                                                    : t('schedule.contactPricing')
                                                }
                                            </div>
                                        </div>
                                        <Button className="rounded-full px-6 font-bold shadow-md" asChild>
                                            <a href="#inquiry">{t('schedule.bookNow')}</a>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* 4. Inquiry Section */}
            <section className="py-24 relative overflow-hidden bg-background text-foreground" id="inquiry">
                <div className="container relative z-10 mx-auto px-6 md:px-12">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className="space-y-10">
                            <div>
                                <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-foreground">
                                    {t('inquiry.title')}
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                                    {t('inquiry.subtitle')}
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border font-bold text-primary text-xl font-display">1</div>
                                    <div>
                                        <h4 className="font-bold text-xl mb-2 text-foreground">{t('inquiry.steps.step1.title')}</h4>
                                        <p className="text-muted-foreground">{t('inquiry.steps.step1.desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border font-bold text-primary text-xl font-display">2</div>
                                    <div>
                                        <h4 className="font-bold text-xl mb-2 text-foreground">{t('inquiry.steps.step2.title')}</h4>
                                        <p className="text-muted-foreground">{t('inquiry.steps.step2.desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border font-bold text-primary text-xl font-display">3</div>
                                    <div>
                                        <h4 className="font-bold text-xl mb-2 text-foreground">{t('inquiry.steps.step3.title')}</h4>
                                        <p className="text-muted-foreground">{t('inquiry.steps.step3.desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent transform rotate-1 rounded-3xl opacity-10 blur-2xl" />
                            <div className="relative bg-card border border-border p-8 md:p-10 rounded-3xl shadow-xl">
                                <ExhibitorForm className="bg-transparent border-0 shadow-none p-0" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
