import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";
import {
  Handshake,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function B2BListPage() {
  const session = await auth();
  if (
    !session?.user ||
    !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)
  ) {
    redirect("/login");
  }

  const events = await prisma.b2BEvent.findMany({
    include: {
      _count: {
        select: { participants: true, meetings: true },
      },
      participants: {
        select: { side: true },
      },
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">B2B Matchmaking</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage B2B meetings between universities and participants
          </p>
        </div>
        <Link href="/admin/b2b/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New B2B Event
          </Button>
        </Link>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16">
          <Handshake className="h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">No B2B events yet</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
            Create your first B2B matchmaking event to start scheduling meetings
            between universities and participants.
          </p>
          <Link href="/admin/b2b/new">
            <Button className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const sideACount = event.participants.filter(
              (p) => p.side === "A"
            ).length;
            const sideBCount = event.participants.filter(
              (p) => p.side === "B"
            ).length;

            return (
              <Link
                key={event.id}
                href={`/admin/b2b/${event.id}`}
                className="group block"
              >
                <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {event.name}
                      </h3>
                      {event.location && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {event.location}
                        </p>
                      )}
                    </div>
                    {event.isScheduleGenerated ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0 ml-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Scheduled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full shrink-0 ml-2">
                        <Clock className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {event.startTime} — {event.endTime}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="text-center rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2">
                      <p className="text-lg font-bold text-blue-600">
                        {sideACount}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Universities
                      </p>
                    </div>
                    <div className="text-center rounded-lg bg-purple-50 dark:bg-purple-950/30 p-2">
                      <p className="text-lg font-bold text-purple-600">
                        {sideBCount}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Participants
                      </p>
                    </div>
                    <div className="text-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                      <p className="text-lg font-bold text-emerald-600">
                        {event._count.meetings}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Meetings
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Created by {event.createdBy.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
