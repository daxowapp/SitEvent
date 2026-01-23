import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { UniversitySidebar } from "./sidebar";

export default async function UniversityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY") {
        redirect("/university/login");
    }

    return (
        <div className="flex min-h-screen bg-black text-white isolate font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black" />
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
            </div>

            <UniversitySidebar user={session.user} />
            <main className="flex-1 md:ml-72 p-6 md:p-10 relative z-10">
                {children}
            </main>
        </div>
    );
}
