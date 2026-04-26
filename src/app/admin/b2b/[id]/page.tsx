import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getB2BEvent } from "@/app/actions/b2b";
import { B2BEventDetailClient } from "@/components/admin/b2b/b2b-event-detail-client";

export default async function B2BEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)
  ) {
    redirect("/login");
  }

  const { id } = await params;
  const event = await getB2BEvent(id);

  if (!event) {
    notFound();
  }

  return <B2BEventDetailClient event={event} />;
}
