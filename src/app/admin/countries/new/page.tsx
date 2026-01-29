import { CountryForm } from "../country-form";
import { requireRole } from "@/lib/role-check";
import { AdminRole } from "@prisma/client";

export default async function NewCountryPage() {
    await requireRole([AdminRole.SUPER_ADMIN]);
    return <CountryForm />;
}
