import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getLiveDashboard } from "@/app/actions/b2b-live";
import { B2BLiveDashboard } from "@/components/admin/b2b/b2b-live-dashboard";

export default async function B2BLivePage({
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
  const data = await getLiveDashboard(id);

  if (!data) {
    notFound();
  }

  return <B2BLiveDashboard data={data} />;
}
