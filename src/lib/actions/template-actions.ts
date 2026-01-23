"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateTemplate(
    id: string,
    data: {
        subject?: string;
        body: string;
    }
) {
    try {
        await prisma.messageTemplate.update({
            where: { id },
            data,
        });

        revalidatePath("/admin/templates");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating template:", error);
        return { success: false, error: error.message || "Failed to update template" };
    }
}
