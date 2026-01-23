"use client";

import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface EventCardProps {
    title: string;
    city: string;
    country: string;
    date: Date | string;
    venueName: string;
    universityCount?: number;
    bannerImageUrl?: string | null;
    slug: string;
    isPast?: boolean;
}

const EventCard = ({
    title,
    city,
    country,
    date,
    venueName,
    universityCount = 40,
    bannerImageUrl,
    slug,
    isPast = false,
}: EventCardProps) => {
    const t = useTranslations('events');
    const eventDate = new Date(date);

    return (
        <div className={`group bg-card rounded-2xl overflow-hidden card-elevated border border-border ${isPast ? 'opacity-75' : ''}`}>
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={bannerImageUrl || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop"}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-lg">
                    <div className="text-xs text-muted-foreground uppercase font-medium">
                        {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-xl font-bold text-foreground">
                        {eventDate.getDate()}
                    </div>
                </div>

                {/* Status Badge */}
                {isPast ? (
                    <div className="absolute top-4 right-4 bg-muted/90 text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                        {t('eventEnded')}
                    </div>
                ) : (
                    <div className="absolute top-4 right-4 bg-success text-success-foreground text-xs font-medium px-3 py-1 rounded-full">
                        {t('registrationOpen')}
                    </div>
                )}

                {/* Location Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-primary-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{city}, {country}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="font-display text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                </h3>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{venueName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{universityCount} {t('participatingUniversities')}</span>
                    </div>
                </div>

                {/* CTA */}
                {!isPast ? (
                    <Button variant="default" className="w-full group/btn" asChild>
                        <Link href={`/events/${slug}`}>
                            {t('viewDetails')}
                            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 ml-2" />
                        </Link>
                    </Button>
                ) : (
                    <Button variant="secondary" className="w-full">
                        {t('viewSummary')}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default EventCard;
