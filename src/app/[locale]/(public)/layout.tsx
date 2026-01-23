import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";

// Generate static params for all locales
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

    // Validate the locale
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Get messages for provider
    const messages = await getMessages();

    // Determine text direction
    const isRTL = locale === 'ar';

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className={`flex min-h-screen flex-col ${isRTL ? 'font-arabic' : ''}`}>
            <NextIntlClientProvider messages={messages}>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </NextIntlClientProvider>
        </div>
    );
}
