import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";
import { Handshake, Calendar, Clock, MapPin, ChevronRight, Radio } from "lucide-react";

export default async function UniversityB2BPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).type !== "UNIVERSITY") {
    redirect("/login");
  }

  const universityId = (session.user as any).universityId;

  const participations = await prisma.b2BParticipant.findMany({
    where: { universityId, side: "A" },
    include: {
      b2bEvent: true,
      _count: { select: { meetingsAsA: true } },
    },
    orderBy: { b2bEvent: { date: "desc" } },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">B2B Meetings</h1>
        <p className="text-muted-foreground mt-1">Your scheduled B2B matchmaking events</p>
      </div>

      {participations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16">
          <Handshake className="h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">No B2B events</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            You haven&apos;t been added to any B2B matchmaking events yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {participations.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex items-center justify-between">
                <Link href={`b2b/${p.b2bEvent.id}`} className="flex-1 group">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{p.b2bEvent.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(p.b2bEvent.date), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.b2bEvent.startTime} — {p.b2bEvent.endTime}</span>
                    {p.b2bEvent.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.b2bEvent.location}</span>}
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{p._count.meetingsAsA}</p>
                    <p className="text-xs text-muted-foreground">meetings</p>
                  </div>
                  <Link
                    href={`/b2b/university/${p.scheduleToken}`}
                    className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                    Go Live
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
