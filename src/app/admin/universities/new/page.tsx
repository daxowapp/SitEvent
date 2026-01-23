import { prisma } from "@/lib/db";
import { UniversityForm } from "../university-form";

async function getCountries() {
    return prisma.country.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, flagEmoji: true }
    });
}

export default async function NewUniversityPage() {
    const countries = await getCountries();
    return <UniversityForm countries={countries} />;
}
