"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Calendar,
    Search,
    LogOut,
    Menu,
    QrCode,
    Sparkles
} from "lucide-react";

const navItems = [
    { name: "Overview", href: "/university/dashboard", icon: LayoutDashboard },
    { name: "My Schedule", href: "/university/events", icon: Calendar },
    { name: "Lead Scanner", href: "/university/scan", icon: QrCode },
    { name: "Event Market", href: "/university/explore", icon: Search },
];

export function UniversitySidebar({ user }: { user: any }) {
    const pathname = usePathname();

    const NavContent = () => (
        <div className="flex flex-col h-full bg-black/50 backdrop-blur-xl border-r border-white/10 text-white">
            <div className="flex h-20 items-center px-6 gap-3 border-b border-white/10 bg-white/5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                    <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                    <span className="font-display font-bold text-lg tracking-wide block">Sit Connect</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/40">University Portal</span>
                </div>
            </div>

            <div className="flex-1 px-4 py-8 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-white/10 text-white shadow-inner"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full" />
                            )}
                            <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-emerald-400" : "text-white/40 group-hover:text-white")} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="mb-4 px-3 py-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm font-medium truncate text-white/90">{user.email}</p>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors h-11 rounded-xl"
                    onClick={() => signOut({ callbackUrl: "/university/login" })}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Nav */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/10 z-40 flex items-center px-4 justify-between">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 border-0 bg-transparent">
                        <NavContent />
                    </SheetContent>
                </Sheet>
                <div className="font-bold flex items-center gap-2 text-white">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                    <span>Sit Connect</span>
                </div>
                <div className="w-8" />
            </div>

            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col md:flex">
                <NavContent />
            </aside>
        </>
    );
}
