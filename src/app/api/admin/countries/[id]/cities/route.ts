import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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
