"use client";

import Image from "next/image";

import { GraduationCap, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

const Footer = () => {
    const t = useTranslations('footer');

    return (
        <footer id="contact" className="bg-foreground text-background">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <a href="/" className="inline-block mb-2">
                            <Image
                                src="/logo-red.svg"
                                alt="Sit Connect"
                                width={120}
                                height={30}
                                className="h-6 w-auto brightness-0 invert"
                            />
                        </a>
                        <div className="font-display font-bold text-xl mb-4 text-background">
                            Sit Connect
                        </div>
                        <p className="text-background/70 text-sm mb-6 leading-relaxed">
                            {t('description')}
                        </p>
                        <div className="flex gap-3">
                            <a href="https://facebook.com/studyintk" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="https://instagram.com/studyintk" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="https://linkedin.com/company/studyintk" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="https://twitter.com/studyintk" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">{t('quickLinks')}</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="/events" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('links.events')}
                                </a>
                            </li>
                            <li>
                                <a href="/#how-it-works" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('links.howItWorks')}
                                </a>
                            </li>
                            <li>
                                <a href="/recruit" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('links.recruit')}
                                </a>
                            </li>
                            <li>
                                <a href="/about" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('links.about')}
                                </a>
                            </li>
                            <li>
                                <a href="/faq" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('links.faq')}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">{t('legal')}</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="/privacy" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('legalLinks.privacy')}
                                </a>
                            </li>
                            <li>
                                <a href="/terms" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('legalLinks.terms')}
                                </a>
                            </li>
                            <li>
                                <a href="/cookies" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('legalLinks.cookies')}
                                </a>
                            </li>
                            <li>
                                <a href="/gdpr" className="text-background/70 hover:text-accent transition-colors text-sm">
                                    {t('legalLinks.gdpr')}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">{t('contact')}</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-accent mt-0.5" />
                                <div>
                                    <p className="text-sm text-background/70">{t('contactInfo.email')}</p>
                                    <a href="mailto:Mahmoud@sitconnect.net" className="text-sm hover:text-accent transition-colors">
                                        Mahmoud@sitconnect.net
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-accent mt-0.5" />
                                <div>
                                    <p className="text-sm text-background/70">{t('contactInfo.phone')}</p>
                                    <a href="tel:+201062717279" className="text-sm hover:text-accent transition-colors">
                                        +20 106 271 7279
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-accent mt-0.5" />
                                <div>
                                    <p className="text-sm text-background/70">{t('contactInfo.office')}</p>
                                    <p className="text-sm">{t('contactInfo.address')}</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-background/10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60">
                        <p>{t('copyright', { year: new Date().getFullYear() })}</p>
                        <p>
                            {t('poweredBy')}{" "}
                            <a href="https://fuarinn.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                Fuar inn
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export { Footer };
