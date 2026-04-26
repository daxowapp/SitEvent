import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Calendar, Clock, MapPin, GraduationCap, Handshake,
} from "lucide-react";

// Format a UTC date's hours/minutes as HH:mm (ignoring local timezone)
function formatUTCTime(date: Date): string {
  const d = new Date(date);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function formatUTCDate(date: Date): string {
  const d = new Date(date);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export default async function PublicB2BSchedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const participant = await prisma.b2BParticipant.findUnique({
    where: { scheduleToken: token },
    include: {
      b2bEvent: true,
      meetingsAsB: {
        include: {
          participantA: {
            include: {
              university: {
                select: { name: true, logoUrl: true, country: true },
              },
            },
          },
        },
        orderBy: { timeSlot: "asc" },
      },
    },
  });

  if (!participant) notFound();

  const event = participant.b2bEvent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-primary/10 p-2.5">
              <Handshake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{event.name}</h1>
              <p className="text-muted-foreground text-sm">B2B Meeting Schedule</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatUTCDate(new Date(event.date))}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {event.startTime} — {event.endTime}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            )}
          </div>

          <div className="mt-4 rounded-lg bg-primary/5 border border-primary/10 p-4">
            <p className="text-sm text-muted-foreground">Schedule for</p>
            <p className="text-xl font-bold">{participant.name}</p>
            {participant.organization && (
              <p className="text-sm text-muted-foreground">{participant.organization}</p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {participant.meetingsAsB.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto opacity-30" />
            <p className="mt-4 text-lg font-medium">Schedule not ready yet</p>
            <p className="mt-1 text-sm">The organizer hasn&apos;t generated the meeting schedule yet. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {participant.meetingsAsB.length} meetings scheduled
            </p>

            {participant.meetingsAsB.map((meeting) => {
              const uniName = meeting.participantA.university?.name || meeting.participantA.name;
              const uniLogo = meeting.participantA.university?.logoUrl;
              const uniCountry = meeting.participantA.university?.country;

              return (
                <div
                  key={meeting.id}
                  className={`rounded-xl bg-white dark:bg-gray-900 border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                    meeting.status === "CANCELLED" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex">
                    {/* Time column */}
                    <div className="bg-primary/5 border-r px-4 py-5 flex flex-col items-center justify-center min-w-[90px]">
                      <p className="text-lg font-bold text-primary">
                        {formatUTCTime(new Date(meeting.timeSlot))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatUTCTime(new Date(meeting.endTime))}
                      </p>
                      {meeting.tableNumber && (
                        <span className="mt-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                          Table {meeting.tableNumber}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-3">
                        {uniLogo ? (
                          <img src={uniLogo} alt="" className="h-10 w-10 rounded-full object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{uniName}</p>
                          {uniCountry && (
                            <p className="text-xs text-muted-foreground">{uniCountry}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Print Footer */}
        <div className="mt-12 text-center text-xs text-muted-foreground print:block">
          <p>Generated by SitConnect B2B Matchmaking System</p>
          <p className="mt-1">© {new Date().getFullYear()} Study in Türkiye</p>
        </div>
      </div>
    </div>
  );
}
