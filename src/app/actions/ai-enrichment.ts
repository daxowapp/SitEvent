"use server";

import { prisma } from "@/lib/db";
import { enrichRegistrantData } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export async function enrichLeadAction(registrantId: string) {
    console.log("SERVER ACTION: enrichLeadAction called with ID:", registrantId);
    try {
        const registrant = await prisma.registrant.findUnique({
            where: { id: registrantId }
        });

        if (!registrant) {
            console.error("SERVER ACTION: Registrant not found");
            return { success: false, error: "Registrant not found" };
        }

        console.log("SERVER ACTION: Found registrant:", registrant.fullName, registrant.interestedMajor);

        const enriched = await enrichRegistrantData(registrant.fullName, registrant.interestedMajor);
        console.log("SERVER ACTION: AI Result:", enriched);

        if (enriched) {
            const update = await prisma.registrant.update({
                where: { id: registrantId },
                data: {
                    standardizedMajor: enriched.standardizedMajor || "Undecided",
                    majorCategory: enriched.majorCategory || "Uncategorized",
                    gender: enriched.gender || "Unknown",
                }
            });
            console.log("SERVER ACTION: Database updated:", update);

            revalidatePath("/university/leads"); // Update the table immediately
            revalidatePath("/admin/registrations"); // Also update admin view
            
            return { 
                success: true, 
                data: enriched 
            };
        } else {
            console.warn("SERVER ACTION: AI returned null");
            return { success: false, error: "AI returned no data" };
        }

    } catch (error: any) {
        console.error("Manual enrichment failed:", error);
        return { success: false, error: error.message || "Enrichment failed" };
    }
}

export async function enrichBulkLeadsAction(registrantIds: string[]) {
    console.log("SERVER ACTION: enrichBulkLeadsAction called with IDs:", registrantIds.length);
    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
    };

    try {
        // Fetch all registrants
        const registrants = await prisma.registrant.findMany({
            where: { id: { in: registrantIds } }
        });

        // Process sequentially to be nice to the AI rate limits (optional: can run in parallel chunks)
        for (const registrant of registrants) {
            try {
                const enriched = await enrichRegistrantData(registrant.fullName, registrant.interestedMajor);
                
                if (enriched) {
                    await prisma.registrant.update({
                        where: { id: registrant.id },
                        data: {
                            standardizedMajor: enriched.standardizedMajor || "Undecided",
                            majorCategory: enriched.majorCategory || "Uncategorized",
                            gender: enriched.gender || "Unknown",
                        }
                    });
                    results.success++;
                } else {
                    results.failed++;
                }
            } catch (err: any) {
                console.error(`Failed to enrich ${registrant.email}:`, err);
                results.failed++;
                results.errors.push(err.message);
            }
        }

        revalidatePath("/university/leads");
        revalidatePath("/admin/registrations");
        
        return { success: true, data: results };

    } catch (error: any) {
        console.error("Bulk enrichment failed:", error);
        return { success: false, error: error.message || "Bulk enrichment failed" };
    }
}
