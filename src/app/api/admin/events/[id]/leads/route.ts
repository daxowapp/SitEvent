import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

// GET /api/admin/events/[id]/leads
// Exports every lead (booth visit / scanned student) captured at an event as CSV.
// One row per university × student scan, with full student contact details and
// the university that captured the lead.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (
        !session?.user ||
        (session.user as any).type !== "ADMIN" ||
        !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const event = await prisma.event.findUnique({
            where: { id },
            select: { title: true, slug: true },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const leads = await prisma.boothVisit.findMany({
            where: { eventId: id },
            include: {
                university: { select: { name: true } },
                scannedBy: { select: { name: true, email: true } },
                registration: {
                    include: { registrant: true },
                },
            },
            // Group a student's leads together, newest event activity first.
            orderBy: [{ universityId: "asc" }, { createdAt: "desc" }],
        });

        const headers = [
            "Event",
            "University",
            "Full Name",
            "Email",
            "Phone",
            "Country",
            "City",
            "Nationality",
            "Level of Study",
            "Interested Major",
            "Major Category",
            "Gender",
            "Points Awarded",
            "Scanned By",
            "Scanned At",
            "Note",
        ];

        const rows = leads.map((lead) => {
            const r = lead.registration.registrant;
            return [
                event.title,
                lead.university?.name || "",
                r.fullName,
                r.email,
                r.phone,
                r.country,
                r.city,
                r.nationality || "",
                r.levelOfStudy || "",
                r.interestedMajor || "",
                r.majorCategory || "",
                r.gender || "",
                String(lead.pointsAwarded),
                lead.scannedBy?.name || lead.scannedBy?.email || "",
                format(new Date(lead.createdAt), "yyyy-MM-dd HH:mm:ss"),
                lead.note || "",
            ];
        });

        // Neutralize CSV/formula injection: a cell that starts with =, +, -, @,
        // tab or CR can be executed as a formula when the admin opens the file in
        // Excel / Sheets. Several columns (name, note, etc.) are filled from the
        // public registration form or by university reps, so prefix any such cell
        // with a single quote before escaping.
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

        const filename = `leads-${event.slug}-${format(new Date(), "yyyy-MM-dd")}.csv`;

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Lead export error:", error);
        return NextResponse.json(
            { error: "Failed to export leads" },
            { status: 500 }
        );
    }
}
