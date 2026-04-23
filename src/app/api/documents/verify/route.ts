import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/documents/verify
 * Public endpoint — verify a document by token or reference number.
 * No authentication required.
 *
 * Query params:
 *   - token: QR token
 *   - ref: Reference number (e.g. LTR-2026-0001)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const ref = searchParams.get("ref");

    if (!token && !ref) {
        return NextResponse.json(
            { valid: false, reason: "No token or reference number provided" },
            { status: 400 }
        );
    }

    try {
        const document = await prisma.validatedDocument.findFirst({
            where: token
                ? { token }
                : { referenceNumber: ref! },
            select: {
                id: true,
                subject: true,
                recipientName: true,
                senderName: true,
                senderTitle: true,
                issuedAt: true,
                expiresAt: true,
                referenceNumber: true,
                isRevoked: true,
                createdAt: true,
            },
        });

        if (!document) {
            return NextResponse.json({
                valid: false,
                reason: "Document not found. This document may not exist in our system.",
            });
        }

        if (document.isRevoked) {
            return NextResponse.json({
                valid: false,
                reason: "This document has been revoked and is no longer valid.",
                referenceNumber: document.referenceNumber,
                subject: document.subject,
            });
        }

        if (document.expiresAt && new Date(document.expiresAt) < new Date()) {
            return NextResponse.json({
                valid: false,
                reason: "This document has expired.",
                referenceNumber: document.referenceNumber,
                subject: document.subject,
                expiresAt: document.expiresAt,
            });
        }

        return NextResponse.json({
            valid: true,
            subject: document.subject,
            recipientName: document.recipientName,
            senderName: document.senderName,
            senderTitle: document.senderTitle,
            issuedAt: document.issuedAt,
            referenceNumber: document.referenceNumber,
        });
    } catch (error) {
        console.error("Verify document error:", error);
        return NextResponse.json(
            { valid: false, reason: "An error occurred during verification" },
            { status: 500 }
        );
    }
}
