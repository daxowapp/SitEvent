"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { UniversityRole } from "@prisma/client";

export async function createUniversityMember(data: {
    name: string;
    email: string;
    role: UniversityRole;
    password?: string;
}) {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId || session.user.role !== "ADMIN") {
        return { success: false, error: "Unauthorized. Only University Admins can manage team members." };
    }

    try {
        if (!data.password) {
            return { success: false, error: "Password is required for new users." };
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        await prisma.universityUser.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                passwordHash,
                universityId: session.user.universityId,
            },
        });

        revalidatePath("/university/team");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating university member:", error);
        if (error.code === "P2002" && error.meta?.target?.includes("email")) {
            return { success: false, error: "Email already exists in the platform. Try another one." };
        }
        return { success: false, error: error.message || "Failed to create team member." };
    }
}

export async function updateUniversityMember(
    id: string,
    data: {
        name?: string;
        email?: string;
        role?: UniversityRole;
        password?: string;
    }
) {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId || session.user.role !== "ADMIN") {
        return { success: false, error: "Unauthorized. Only University Admins can manage team members." };
    }

    try {
        // Ensure the admin target is actually in their university
        const member = await prisma.universityUser.findUnique({ where: { id } });
        if (!member || member.universityId !== session.user.universityId) {
            return { success: false, error: "Member not found in your university." };
        }

        const updateData: any = { ...data };
        delete updateData.password;

        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        await prisma.universityUser.update({
            where: { id },
            data: updateData,
        });

        revalidatePath("/university/team");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating university member:", error);
        if (error.code === "P2002" && error.meta?.target?.includes("email")) {
            return { success: false, error: "Email already exists." };
        }
        return { success: false, error: error.message || "Failed to update team member." };
    }
}

export async function deleteUniversityMember(id: string) {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId || session.user.role !== "ADMIN") {
        return { success: false, error: "Unauthorized. Only University Admins can manage team members." };
    }

    // Prevent self-deletion
    if (id === session.user.id) {
        return { success: false, error: "You cannot delete your own account." };
    }

    try {
        // Enforce boundary
        const member = await prisma.universityUser.findUnique({ where: { id } });
        if (!member || member.universityId !== session.user.universityId) {
            return { success: false, error: "Member not found in your university." };
        }

        await prisma.universityUser.delete({
            where: { id },
        });

        revalidatePath("/university/team");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting university member:", error);
        return { success: false, error: error.message || "Failed to delete team member." };
    }
}
