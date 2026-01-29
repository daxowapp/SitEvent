import { notFound } from "next/navigation";
import { CountryForm } from "../../country-form";
import { getCountry } from "../../actions";
import { requireRole } from "@/lib/role-check";
import { AdminRole } from "@prisma/client";

interface EditCountryPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCountryPage({ params }: EditCountryPageProps) {
    await requireRole([AdminRole.SUPER_ADMIN]);
    const { id } = await params;
    const country = await getCountry(id);

    if (!country) {
        notFound();
    }

    return <CountryForm country={country} />;
}
