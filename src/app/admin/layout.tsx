import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/sidebar";
import { Inter, Playfair_Display } from "next/font/google"; // Import fonts
import "../globals.css"; // Import globals
import { Toaster } from "@/components/ui/sonner";
import { AdminRole } from "@prisma/client";
import { headers } from "next/headers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata = {
    title: {
        template: "%s | SitConnect Admin",
        default: "Admin Dashboard | SitConnect",
    },
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
        redirect("/login");
    }

    // Check if user is an admin type (not UNIVERSITY)
    const userType = (session.user as any).type;
    if (userType !== "ADMIN") {
        redirect("/login");
    }

    const role = session.user.role as AdminRole;

    // Note: Role-based page restrictions for EVENT_STAFF and USHER
    // should be handled in middleware or individual page components,
    // not here, as x-pathname headers are not reliable in Next.js 16+

    return (
        <html lang="en" className={`${inter.variable}`}>
            <body className="font-sans antialiased text-gray-900 bg-gray-50">
                <div className="min-h-screen bg-gray-50">
                    <AdminSidebar user={session.user} />
                    <AdminMobileNav user={session.user} />

                    {/* Main content area */}
                    <div className="md:pl-64">
                        <main className="py-6 px-4 sm:px-6 lg:px-8">
                            {children}
                        </main>
                    </div>
                </div>
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
