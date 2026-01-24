"use client";

import Image from "next/image";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight, Sparkles, Home, Calendar, Info, GraduationCap, Phone } from "lucide-react";
import { TicketRecoveryDialog } from "./ticket-recovery-dialog";

export const Header = () => {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const locale = useLocale();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Pages that should have a transparent header at the top
    const isTransparentPage = (pathname === "/" || pathname.includes("/events/")) && !pathname.includes("/success");

    // Always show solid header on non-transparent pages or when scrolled
    const showSolidHeader = isScrolled || !isTransparentPage;

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "/", label: t('home'), icon: Home },
        { href: "/events", label: t('events'), icon: Calendar },
        { href: "/#how-it-works", label: t('about'), icon: Info },
        { href: "/recruit", label: t('recruit'), icon: GraduationCap },
        { href: "/#contact", label: t('contact'), icon: Phone },
    ];

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b border-transparent",
                    showSolidHeader
                        ? "bg-background/95 backdrop-blur-xl shadow-sm border-border/50 py-3 text-foreground"
                        : "bg-transparent py-5 text-white"
                )}
            >
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex flex-col items-center gap-1 group relative z-50">
                            <Image
                                src="/logo-red.svg"
                                alt="Sit Connect"
                                width={90}
                                height={20}
                                className={cn(
                                    "h-5 w-auto transition-all duration-300",
                                    !showSolidHeader && "brightness-0 invert"
                                )}
                                priority
                            />
                            <span className={cn(
                                "font-display font-bold text-[10px] uppercase tracking-widest leading-none hidden sm:block transition-colors",
                                showSolidHeader ? "text-foreground" : "text-white"
                            )}>
                                Sit Connect
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className={cn(
                            "hidden md:flex items-center gap-1 p-1 rounded-full border px-2 shadow-inner transition-colors",
                            showSolidHeader
                                ? "bg-secondary/50 backdrop-blur-md border-white/10"
                                : "bg-white/10 backdrop-blur-md border-white/20"
                        )}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium transition-all rounded-full hover:shadow-sm flex items-center gap-2",
                                        showSolidHeader
                                            ? "text-muted-foreground hover:text-foreground hover:bg-background/80"
                                            : "text-white/90 hover:text-white hover:bg-white/20"
                                    )}
                                >
                                    <link.icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Actions & Locale */}
                        <div className="hidden md:flex items-center gap-4">
                            <TicketRecoveryDialog />
                            <div className={cn("h-6 w-px", showSolidHeader ? "bg-border/50" : "bg-white/20")} />
                            <LanguageSwitcher className={cn(
                                showSolidHeader ? "text-muted-foreground hover:text-foreground" : "text-white/90 hover:text-white hover:bg-white/10"
                            )} />
                            <div className={cn("h-6 w-px", showSolidHeader ? "bg-border/50" : "bg-white/20")} />
                            <Link
                                href="/university/login"
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary mr-2",
                                    showSolidHeader ? "text-muted-foreground" : "text-white/90 hover:text-white"
                                )}
                            >
                                Universities Login
                            </Link>
                            <Button
                                variant={showSolidHeader ? "default" : "secondary"}
                                size="sm"
                                className={cn(
                                    "rounded-full px-6 shadow-md transition-all",
                                    showSolidHeader
                                        ? "shadow-primary/20 hover:shadow-primary/40"
                                        : "bg-white text-primary hover:bg-white/90 shadow-black/10"
                                )}
                                asChild
                            >
                                <Link href="/recruit#inquiry" className="gap-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {t('partner')}
                                </Link>
                            </Button>
                        </div>

                        {/* Mobile Toggle */}
                        <div className="flex md:hidden items-center gap-4">
                            <LanguageSwitcher className={cn(
                                showSolidHeader ? "text-muted-foreground" : "text-white"
                            )} />
                            <button
                                className={cn(
                                    "p-2 active:scale-95 transition-transform",
                                    showSolidHeader ? "text-foreground" : "text-white"
                                )}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X /> : <Menu />}
                            </button>
                        </div>
                    </div>
                </div>
            </header >

            {/* Mobile Menu Overlay */}
            < div
                className={
                    cn(
                        "fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl transition-all duration-300 md:hidden flex flex-col pt-32 px-6",
                        mobileMenuOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-10"
                    )
                }
            >
                <nav className="flex flex-col gap-6 text-center">
                    {navLinks.map((link, idx) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-2xl font-display font-bold text-foreground hover:text-primary transition-colors flex items-center justify-center gap-3"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ transitionDelay: `${idx * 50}ms` }}
                        >
                            <link.icon className="w-6 h-6" />
                            {link.label}
                        </Link>
                    ))}
                    <div className="h-px bg-border w-1/2 mx-auto my-4" />
                    <Button size="lg" variant="ghost" className="w-full text-lg h-14 rounded-2xl" asChild>
                        <Link href="/university/login" onClick={() => setMobileMenuOpen(false)}>
                            Universities Login
                        </Link>
                    </Button>
                    <Button size="lg" className="w-full text-lg h-14 rounded-2xl shadow-xl shadow-primary/20" asChild>
                        <Link href="/recruit#inquiry" onClick={() => setMobileMenuOpen(false)}>
                            {t('partner')} <ArrowRight className="ml-2 w-5 h-5 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
                        </Link>
                    </Button>
                </nav>
            </div >
        </>
    );
};
