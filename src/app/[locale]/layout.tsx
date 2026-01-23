import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Inter, Cairo } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/public/header";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const cairo = Cairo({
    subsets: ["arabic"],
    variable: "--font-cairo",
});

export const metadata = {
    title: "Sit Connect - Connect with Top Universities",
    description: "Meet university representatives at education fairs near you.",
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages();
    const isArabic = locale === 'ar';
    const direction = isArabic ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={direction} className={`${inter.variable} ${cairo.variable}`}>
            <body className="font-sans antialiased">
                <NextIntlClientProvider messages={messages}>
                    {children}
                    <Toaster position="top-right" richColors />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
