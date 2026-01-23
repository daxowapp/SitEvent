import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/sidebar";
import { Inter, Playfair_Display } from "next/font/google"; // Import fonts
import "../globals.css"; // Import globals
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const role = session.user.role;

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
