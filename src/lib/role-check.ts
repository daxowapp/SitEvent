import { auth } from "@/lib/auth";
import { AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Server-side role check for admin pages.
 * @param allowedRoles List of roles allowed to access the page
 * @returns The session user if authorized
 */
export async function requireRole(allowedRoles: AdminRole[]) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Check if user is an admin type (not UNIVERSITY)
    if ((session.user as any).type !== "ADMIN") {
        redirect("/login");
    }

    if (!allowedRoles.includes(session.user.role as AdminRole)) {
        // Redirect based on role defaults if unauthorized
        if (session.user.role === AdminRole.EVENT_STAFF || session.user.role === AdminRole.USHER) {
            redirect("/admin/scan");
        } else {
            redirect("/admin");
        }
    }

    return session.user;
}

/**
 * Require any admin user (not UNIVERSITY type).
 * Allows all AdminRole types.
 */
export async function requireAdmin() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Check if user is an admin type (not UNIVERSITY)
    if ((session.user as any).type !== "ADMIN") {
        redirect("/login");
    }

    return session.user;
}

/**
 * Require SUPER_ADMIN or EVENT_MANAGER role.
 */
export async function requireManagerOrAbove() {
    return requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]);
}
