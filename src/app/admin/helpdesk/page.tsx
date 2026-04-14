import { requireAdmin } from "@/lib/role-check";
import { HelpDeskClient } from "@/components/admin/helpdesk-client";

export const metadata = {
  title: "Help Desk - Red Points Gift Redemption",
  description: "Verify student Red Points and redeem gifts",
};

export default async function HelpDeskPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <div className="container max-w-lg mx-auto py-6 px-4">
        <HelpDeskClient />
      </div>
    </div>
  );
}
