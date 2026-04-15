import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CalendarX, SearchX } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

export const dynamic = 'force-dynamic';

export default async function ActiveEventRedirectPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    // Resolve params
    const resolvedParams = await params;
    const { locale } = resolvedParams;

    // Enable static rendering config for next-intl
    setRequestLocale(locale);

    // Find the closest published event that hasn't finished yet
    // Ordered ascending by start date, so the soonest upcoming event is picked.
    const activeEvent = await prisma.event.findFirst({
        where: {
            status: "PUBLISHED",
            endDateTime: {
                gte: new Date(),
            }
        },
        orderBy: {
            startDateTime: "asc"
        }
    });

    if (activeEvent) {
        // Automatically redirect to the registration page for this event
        redirect(`/${locale}/events/${activeEvent.slug}`);
    }

    // Fallback UI if there are no active/upcoming events at all
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-gray-50/50">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 border border-red-100 shadow-sm">
                <CalendarX className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
                No Active Events
            </h1>
            
            <p className="text-gray-500 max-w-lg text-lg leading-relaxed mb-10">
                We don't currently have any events actively open for registration at this moment. We host global fairs continuously, so please check back soon!
            </p>

            <a 
                href={`/${locale}/events`} 
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-black transition-colors shadow-md"
            >
                <SearchX className="w-5 h-5" />
                View Past Events
            </a>
        </div>
    );
}
