import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateDocumentQrDataUrl, getDocumentVerifyUrl } from "@/lib/qr";

/**
 * GET /api/admin/documents/[id]
 * Get a single validated document
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || (session.user as any).type !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await prisma.validatedDocument.findUnique({
        where: { id },
        include: {
            createdBy: { select: { name: true, email: true } },
        },
    });

    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const qrDataUrl = await generateDocumentQrDataUrl(document.token);
    const verifyUrl = getDocumentVerifyUrl(document.token);

    return NextResponse.json({ document, qrDataUrl, verifyUrl });
}

/**
 * PATCH /api/admin/documents/[id]
 * Update a validated document
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || (session.user as any).type !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { subject, recipientName, senderName, senderTitle, issuedAt, expiresAt, notes, isRevoked } = body;

        const existing = await prisma.validatedDocument.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        const document = await prisma.validatedDocument.update({
            where: { id },
            data: {
                ...(subject !== undefined && { subject: subject.trim() }),
                ...(recipientName !== undefined && { recipientName: recipientName?.trim() || null }),
                ...(senderName !== undefined && { senderName: senderName?.trim() || null }),
                ...(senderTitle !== undefined && { senderTitle: senderTitle?.trim() || null }),
                ...(issuedAt !== undefined && { issuedAt: new Date(issuedAt) }),
                ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
                ...(notes !== undefined && { notes: notes?.trim() || null }),
                ...(isRevoked !== undefined && { isRevoked }),
            },
            include: {
                createdBy: { select: { name: true, email: true } },
            },
        });

        return NextResponse.json({ document });
    } catch (error) {
        console.error("Update document error:", error);
        return NextResponse.json(
            { error: "Failed to update document" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/documents/[id]
 * Delete a validated document
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || (session.user as any).type !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.validatedDocument.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete document error:", error);
        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}
