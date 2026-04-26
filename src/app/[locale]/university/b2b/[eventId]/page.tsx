import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getUniversityB2BSchedule } from "@/app/actions/b2b";
import { B2BUniversityScheduleClient } from "@/components/university/b2b-university-schedule";

export default async function UniversityB2BEventPage({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).type !== "UNIVERSITY") {
    redirect("/login");
  }

  const { eventId } = await params;
  const universityId = (session.user as any).universityId;

  const participant = await getUniversityB2BSchedule(universityId, eventId);
  if (!participant) notFound();

  return <B2BUniversityScheduleClient participant={participant} />;
}
