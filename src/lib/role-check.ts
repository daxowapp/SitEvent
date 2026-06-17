import { auth } from "@/lib/auth";
import { AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

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

/**
 * Guard for admin API route handlers. Unlike requireRole/requireAdmin (which
 * redirect and are meant for pages/server components), this returns a 401
 * NextResponse to return early, or null when the caller is an authorized ADMIN.
 *
 * Route handlers under /api/admin are NOT covered by the admin layout guard,
 * so each one must call this itself.
 *
 * @param roles Optional AdminRole allow-list; when omitted, any ADMIN passes.
 */
export async function requireApiAdmin(roles?: AdminRole[]): Promise<NextResponse | null> {
    const session = await auth();
    const user = session?.user as { type?: string; role?: AdminRole } | undefined;

    if (!user || user.type !== "ADMIN" || (roles && !roles.includes(user.role as AdminRole))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return null;
}

/**
 * API guard for manager-level operations (SUPER_ADMIN or EVENT_MANAGER).
 */
export async function requireApiManager(): Promise<NextResponse | null> {
    return requireApiAdmin([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]);
}
