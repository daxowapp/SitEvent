import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { KioskShell } from "@/components/kiosk/kiosk-shell";

interface KioskPageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

export default async function KioskPage({ params }: KioskPageProps) {
    const { slug, locale } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            startDateTime: true,
            endDateTime: true,
            venueName: true,
            city: true,
            country: true,
            bannerImageUrl: true,
            cityRef: {
                select: {
                    name: true,
                    country: {
                        select: {
                            name: true,
                            code: true
                        }
                    }
                }
            }
        },
    });

    if (!event) {
        notFound();
    }

    // Determine target locale based on event location
    let targetLocale = "en"; // Default
    const city = event.cityRef?.name || event.city || "";
    const country = event.cityRef?.country.name || event.country || "";

    // Normailze strings for comparison
    const cityNormalized = city.toLowerCase();
    const countryNormalized = country.toLowerCase();

    if (countryNormalized === "turkey" || cityNormalized === "istanbul" || cityNormalized === "ankara" || cityNormalized === "izmir") {
        targetLocale = "tr";
    } else if (countryNormalized === "egypt" || cityNormalized === "cairo" || cityNormalized === "alexandria" || countryNormalized === "saudi arabia" || countryNormalized === "uae" || countryNormalized === "jordan") {
        targetLocale = "ar";
    }

    // Redirect if current locale doesn't match target (and we want to enforce it)
    // For now, we only redirect if the user visits the root or we want to force consistency.
    // If the user manually types /en/kiosk/..., we might want to respect it OR force it. 
    // The user's request "event in cairo it should be arabic" implies a force or default.
    // Let's force it for the Kiosk to ensure the experience is correct for the location.
    
    if (locale !== targetLocale) {
        // Construct new path: replace /current-locale/ with /target-locale/
        // Note: usage of redirect throws an error that is caught by Next.js, so it must be outside try/catch if any
        // Assuming path is /[locale]/kiosk/[slug]
        redirect(`/${targetLocale}/kiosk/${slug}`);
    }

    return (
        <KioskShell event={event} locale={locale} />
    );
}
