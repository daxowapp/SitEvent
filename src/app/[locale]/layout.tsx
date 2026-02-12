import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Inter, Cairo } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/public/header";
import Script from 'next/script';

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
    icons: {
        icon: "/icon.png",
        shortcut: "/favicon.ico",
        apple: "/icon.png",
    },
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
                <Script id="meta-pixel" strategy="afterInteractive">
                    {`
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '1378542223283943');
                    fbq('track', 'PageView');
                    `}
                </Script>
                <noscript>
                    <img
                        height="1"
                        width="1"
                        style={{ display: 'none' }}
                        src="https://www.facebook.com/tr?id=1378542223283943&ev=PageView&noscript=1"
                        alt=""
                    />
                </noscript>
                <NextIntlClientProvider messages={messages}>
                    {children}
                    <Toaster position="top-right" richColors />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
