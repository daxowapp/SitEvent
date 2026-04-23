import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateDocumentQrDataUrl, getDocumentVerifyUrl } from "@/lib/qr";

/**
 * GET /api/admin/documents
 * List all validated documents (admin only)
 */
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user || (session.user as any).type !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const where = search
        ? {
            OR: [
                { subject: { contains: search, mode: "insensitive" as const } },
                { referenceNumber: { contains: search, mode: "insensitive" as const } },
                { recipientName: { contains: search, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [documents, total] = await Promise.all([
        prisma.validatedDocument.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                createdBy: { select: { name: true, email: true } },
            },
        }),
        prisma.validatedDocument.count({ where }),
    ]);

    return NextResponse.json({
        documents,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
}

/**
 * POST /api/admin/documents
 * Create a new validated document
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user || (session.user as any).type !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { subject, recipientName, senderName, senderTitle, issuedAt, expiresAt, notes } = body;

        if (!subject || subject.trim().length === 0) {
            return NextResponse.json(
                { error: "Subject is required" },
                { status: 400 }
            );
        }

        // Generate sequential reference number
        const count = await prisma.validatedDocument.count();
        const refNumber = `LTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

        const document = await prisma.validatedDocument.create({
            data: {
                subject: subject.trim(),
                recipientName: recipientName?.trim() || null,
                senderName: senderName?.trim() || null,
                senderTitle: senderTitle?.trim() || null,
                referenceNumber: refNumber,
                issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                notes: notes?.trim() || null,
                createdById: (session.user as any).id,
            },
            include: {
                createdBy: { select: { name: true, email: true } },
            },
        });

        // Generate QR code
        const qrDataUrl = await generateDocumentQrDataUrl(document.token);
        const verifyUrl = getDocumentVerifyUrl(document.token);

        return NextResponse.json({
            document,
            qrDataUrl,
            verifyUrl,
        }, { status: 201 });
    } catch (error) {
        console.error("Create document error:", error);
        return NextResponse.json(
            { error: "Failed to create document" },
            { status: 500 }
        );
    }
}
