import { notFound } from "next/navigation";
import { getUniversityLiveView } from "@/app/actions/b2b-public";
import { UniversityLiveView } from "@/components/b2b/university-live-view";

export default async function UniversityLivePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getUniversityLiveView(token);

  if (!data) notFound();

  return <UniversityLiveView data={data} token={token} />;
}
