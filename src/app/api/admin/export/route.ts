import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (
            !session?.user ||
            (session.user as any).type !== "ADMIN" ||
            !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)
        ) {
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
            "Standardized Major",
            "Major Category",
            "Gender",
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
            reg.registrant.standardizedMajor || "",
            reg.registrant.majorCategory || "",
            reg.registrant.gender || "",
            format(new Date(reg.createdAt), "yyyy-MM-dd HH:mm:ss"),
            reg.checkIn ? "Yes" : "No",
            reg.checkIn ? format(new Date(reg.checkIn.checkedInAt), "yyyy-MM-dd HH:mm:ss") : "",
            reg.checkIn?.method || "",
            reg.registrant.utmSource || "",
            reg.registrant.utmMedium || "",
            reg.registrant.utmCampaign || "",
        ]);

        // Escape CSV values and neutralize formula injection: a cell beginning
        // with =,+,-,@,\t,\r can be executed as a formula by Excel/Sheets, and
        // these fields come from the public registration form.
        const escapeCSV = (value: string) => {
            const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
            if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
                return `"${safe.replace(/"/g, '""')}"`;
            }
            return safe;
        };

        // Prepend a UTF-8 BOM so Excel renders Arabic / accented names correctly.
        const csv =
            "\uFEFF" +
            [
                headers.join(","),
                ...rows.map((row) => row.map(escapeCSV).join(",")),
            ].join("\n");

        // Use the event slug for a readable filename when exporting one event.
        const event = eventId
            ? await prisma.event.findUnique({
                  where: { id: eventId },
                  select: { slug: true },
              })
            : null;
        const filename = eventId
            ? `registrations-${event?.slug || eventId}-${format(new Date(), "yyyy-MM-dd")}.csv`
            : `all-registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
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
