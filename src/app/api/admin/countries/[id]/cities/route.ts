import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiAdmin } from "@/lib/role-check";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const denied = await requireApiAdmin();
    if (denied) return denied;

    const { id } = await params;

    const cities = await prisma.city.findMany({
        where: { countryId: id },
        select: {
            id: true,
            name: true,
            countryId: true,
        },
        orderBy: { name: 'asc' }
    });

    return NextResponse.json(cities);
}
