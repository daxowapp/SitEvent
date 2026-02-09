import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UniversitySidebar } from "./sidebar";

import { LanguageSwitcher } from "@/components/public/language-switcher";

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
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 text-gray-900 font-sans">
            {/* Subtle background pattern */}
            <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 pointer-events-none" />
            
            <UniversitySidebar user={session.user} />
            
            <main className="flex-1 md:ml-72 relative z-10 min-h-screen flex flex-col">
                {/* Desktop Top Navbar */}
                <header className="hidden md:flex h-16 items-center justify-end px-10 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md border-b border-gray-200/50">
                    <LanguageSwitcher />
                </header>

                <div className="flex-1 p-6 md:p-10 pt-20 md:pt-6 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
