import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BoothScannerClient } from "@/components/university/booth-scanner-client";

export const metadata = {
  title: "Booth Scanner - SitConnect",
  description: "Scan student QR codes at your university booth",
};

export default async function BoothScannerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as any).type !== "UNIVERSITY") {
    redirect("/login");
  }

  return (
    <div className="w-full">
      <div className="container max-w-lg mx-auto py-6 px-4">
        <BoothScannerClient />
      </div>
    </div>
  );
}
