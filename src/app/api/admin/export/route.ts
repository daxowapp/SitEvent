import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");

        const where: Record<string, unknown> = {};
        if (eventId) {
            where.eventId = eventId;
        }

        const registrations = await prisma.registration.findMany({
            where,
            include: {
                event: { select: { title: true } },
                registrant: true,
                checkIn: { select: { checkedInAt: true, method: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Generate CSV
        const headers = [
            "Event",
            "Full Name",
            "Email",
            "Phone",
            "Country",
            "City",
            "Nationality",
            "Level of Study",
            "Interested Major",
            "Registered At",
            "Checked In",
            "Check-in Time",
            "Check-in Method",
            "UTM Source",
            "UTM Medium",
            "UTM Campaign",
        ];

        const rows = registrations.map((reg) => [
            reg.event.title,
            reg.registrant.fullName,
            reg.registrant.email,
            reg.registrant.phone,
            reg.registrant.country,
            reg.registrant.city,
            reg.registrant.nationality || "",
            reg.registrant.levelOfStudy || "",
            reg.registrant.interestedMajor || "",
            format(new Date(reg.createdAt), "yyyy-MM-dd HH:mm:ss"),
            reg.checkIn ? "Yes" : "No",
            reg.checkIn ? format(new Date(reg.checkIn.checkedInAt), "yyyy-MM-dd HH:mm:ss") : "",
            reg.checkIn?.method || "",
            reg.registrant.utmSource || "",
            reg.registrant.utmMedium || "",
            reg.registrant.utmCampaign || "",
        ]);

        // Escape CSV values
        const escapeCSV = (value: string) => {
            if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const csv = [
            headers.join(","),
            ...rows.map((row) => row.map(escapeCSV).join(",")),
        ].join("\n");

        const filename = eventId
            ? `registrations-${eventId}-${format(new Date(), "yyyy-MM-dd")}.csv`
            : `all-registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { error: "Failed to export" },
            { status: 500 }
        );
    }
}
