import { prisma } from "@/lib/db";
import { UniversityForm } from "../university-form";
import { requireManagerOrAbove } from "@/lib/role-check";

async function getCountries() {
    return prisma.country.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, flagEmoji: true }
    });
}

export default async function NewUniversityPage() {
    await requireManagerOrAbove();
    const countries = await getCountries();
    return <UniversityForm countries={countries} />;
}

