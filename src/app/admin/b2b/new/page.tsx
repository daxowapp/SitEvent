import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { B2BEventForm } from "@/components/admin/b2b/b2b-event-form";

export default async function NewB2BEventPage() {
  const session = await auth();
  if (
    !session?.user ||
    !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)
  ) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create B2B Event</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new B2B matchmaking event with time slots and meeting configuration
        </p>
      </div>

      <B2BEventForm />
    </div>
  );
}
