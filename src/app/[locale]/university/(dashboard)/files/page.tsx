import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UniversityFilesClient } from "@/components/university/university-files-client";

export const metadata = {
  title: "Files & Brochures - SitConnect",
  description: "Manage your university brochures and catalogs",
};

export default async function UniversityFilesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as any).type !== "UNIVERSITY") {
    redirect("/login");
  }

  const universityId = (session.user as any).universityId;
  if (!universityId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <UniversityFilesClient universityId={universityId} />
      </div>
    </div>
  );
}
