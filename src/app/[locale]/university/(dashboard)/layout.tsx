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
        <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
            <UniversitySidebar user={session.user} />
            <main className="flex-1 md:ml-72 p-6 md:p-10 relative z-10">
                {children}
            </main>
        </div>
    );
}
