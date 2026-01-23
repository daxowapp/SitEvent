"use client";

import EventCard from "./EventCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface DisplayEvent {
    id: string;
    title: string;
    slug: string;
    country: string | null;
    city: string | null;
    venueName: string | null;
    bannerImageUrl: string | null;
    startDateTime: Date;
    status: string;
}

interface EventsSectionProps {
    upcomingEvents: DisplayEvent[];
    pastEvents: DisplayEvent[];
}

const EventsSection = ({ upcomingEvents, pastEvents }: EventsSectionProps) => {
    const t = useTranslations('events');
    const tHome = useTranslations('home');

    return (
        <section id="events" className="py-20 bg-background">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-3">
                        {t('browseEvents') || "Browse Events"}
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                        {t('upcomingEvents')}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Upcoming Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                title={event.title}
                                city={event.city}
                                country={event.country}
                                date={event.startDateTime}
                                venueName={event.venueName}
                                slug={event.slug}
                                bannerImageUrl={event.bannerImageUrl}
                                isPast={false}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            {t('noEvents')}
                        </div>
                    )}
                </div>

                {/* View All Button */}
                <div className="text-center mb-20">
                    <Button variant="outline" size="lg" asChild>
                        <a href="/events">
                            {t('viewAllEvents') || "View All Upcoming Events"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                    </Button>
                </div>

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <div className="border-t border-border pt-16">
                        <div className="text-center mb-10">
                            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                                {t('pastEvents')}
                            </h3>
                            <p className="text-muted-foreground">
                                Missed an event? Check out our previous fairs and stay tuned for upcoming ones.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {pastEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    title={event.title}
                                    city={event.city}
                                    country={event.country}
                                    date={event.startDateTime}
                                    venueName={event.venueName}
                                    slug={event.slug}
                                    bannerImageUrl={event.bannerImageUrl}
                                    isPast={true}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default EventsSection;
