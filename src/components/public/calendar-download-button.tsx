"use client";

import { Button } from "@/components/ui/button";

interface CalendarDownloadButtonProps {
    events: {
        id: string;
        title: string;
        startDateTime: Date;
        city: string | null;
        country: string | null;
        venueName: string | null;
    }[];
    label: string;
}

export function CalendarDownloadButton({ events, label }: CalendarDownloadButtonProps) {
    const handleDownload = () => {
        const calendarContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//SitConnect//Events//EN',
            ...events.map(event => [
                'BEGIN:VEVENT',
                `UID:${event.id}@sitconnect.net`,
                `DTSTAMP:${new Date().toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\./g, '')}`,
                `DTSTART:${new Date(event.startDateTime).toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\./g, '')}`,
                `SUMMARY:${event.title}`,
                `DESCRIPTION:Join us at ${event.title} in ${event.city}, ${event.country}.`,
                `LOCATION:${event.venueName}, ${event.city}, ${event.country}`,
                'END:VEVENT'
            ].join('\n')),
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([calendarContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'sitconnect-events.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button 
            variant="outline" 
            className="rounded-full"
            onClick={handleDownload}
        >
            {label}
        </Button>
    );
}
