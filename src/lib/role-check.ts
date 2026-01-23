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

    if (!allowedRoles.includes(session.user.role as AdminRole)) {
        // Redirect based on role defaults if unauthorized
        if (session.user.role === AdminRole.EVENT_STAFF) {
            redirect("/admin/scan");
        } else {
            redirect("/admin");
        }
    }

    return session.user;
}
