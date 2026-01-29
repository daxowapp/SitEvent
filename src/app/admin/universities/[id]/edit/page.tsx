import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { UniversityForm } from "../../university-form";
import { getUniversity } from "../../actions";
import { requireManagerOrAbove } from "@/lib/role-check";

async function getCountries() {
    return prisma.country.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, flagEmoji: true }
    });
}

interface EditUniversityPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditUniversityPage({ params }: EditUniversityPageProps) {
    await requireManagerOrAbove();
    const { id } = await params;
    const [university, countries] = await Promise.all([
        getUniversity(id),
        getCountries()
    ]);

    if (!university) {
        notFound();
    }

    const typedUniversity = {
        ...university,
        programs: university.programs as unknown as string[] | null
    };

    return <UniversityForm university={typedUniversity} countries={countries} />;
}
