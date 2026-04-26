import { notFound } from "next/navigation";
import { getParticipantLiveView } from "@/app/actions/b2b-public";
import { ParticipantLiveView } from "@/components/b2b/participant-live-view";

export default async function ParticipantLivePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getParticipantLiveView(token);

  if (!data) notFound();

  return <ParticipantLiveView data={data} token={token} />;
}
