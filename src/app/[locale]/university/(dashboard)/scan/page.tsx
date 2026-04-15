import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ScannerClient } from "./scanner-client";

export default async function LeadScannerPage() {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    const universityId = session.user.universityId;

    // Fetch the total number of students scanned by this university
    // (This count will initialize the scanner, preventing it from resetting to 0 on refresh)
    const scanCount = await prisma.boothVisit.count({
        where: {
            universityId: universityId
        }
    });

    return (
        <ScannerClient initialScanCount={scanCount} />
    );
}
