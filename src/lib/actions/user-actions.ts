"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function createAdminUser(data: {
    name: string;
    email: string;
    role: AdminRole;
    password?: string;
    accessCode?: string;
}) {
    try {
        const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;
        
        // Clean access code: trim and convert empty to null
        const accessCode = data.accessCode?.trim() || null;

        await prisma.adminUser.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                passwordHash,
                accessCode,
            },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating admin user:", error);
        if (error.code === "P2002" && error.meta?.target?.includes("accessCode")) {
            return { success: false, error: "Access Code already exists. Please choose a different one." };
        }
        if (error.code === "P2002" && error.meta?.target?.includes("email")) {
            return { success: false, error: "Email already exists." };
        }
        return { success: false, error: error.message || "Failed to create user" };
    }
}

export async function updateAdminUser(
    id: string,
    data: {
        name?: string;
        email?: string;
        role?: AdminRole;
        isActive?: boolean;
        password?: string;
        accessCode?: string;
    }
) {
    try {
        const updateData: any = { ...data };
        delete updateData.password;

        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }
        
        if (typeof data.accessCode !== 'undefined') {
            updateData.accessCode = data.accessCode?.trim() || null;
        }

        await prisma.adminUser.update({
            where: { id },
            data: updateData,
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating admin user:", error);
        if (error.code === "P2002" && error.meta?.target?.includes("accessCode")) {
            return { success: false, error: "Access Code already exists. Please choose a different one." };
        }
        if (error.code === "P2002" && error.meta?.target?.includes("email")) {
            return { success: false, error: "Email already exists." };
        }
        return { success: false, error: error.message || "Failed to update user" };
    }
}

export async function deleteAdminUser(id: string) {
    try {
        // Instead of hard delete, maybe just deactivate for safety?
        // But the plan says "Delete/Toggle Status". Let's do hard delete for now if requested,
        // but toggle status is safer. Let's stick to update isActive for "Delete" action in UI usually.
        await prisma.adminUser.delete({
            where: { id },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting admin user:", error);
        return { success: false, error: error.message || "Failed to delete user" };
    }
}
