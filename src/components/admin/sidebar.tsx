"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
    Users as UsersIcon,
    Camera as CameraIcon,
    LogOut,
    Menu,
    X,
    MessageSquare as MessageSquareIcon,
    ShieldCheck as ShieldCheckIcon,
    LayoutDashboard,
    Calendar as CalendarIcon,
    Globe,
    MapPin,
    GraduationCap,
} from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "EVENT_MANAGER"] },
    { name: "Events", href: "/admin/events", icon: CalendarIcon, roles: ["SUPER_ADMIN", "EVENT_MANAGER"] },
    { name: "Registrations", href: "/admin/registrations", icon: UsersIcon, roles: ["SUPER_ADMIN", "EVENT_MANAGER"] },
    { name: "Scan QR", href: "/admin/scan", icon: CameraIcon, roles: ["SUPER_ADMIN", "EVENT_MANAGER", "EVENT_STAFF", "USHER"] },
    { name: "Countries", href: "/admin/countries", icon: Globe, roles: ["SUPER_ADMIN"] },
    { name: "Cities", href: "/admin/cities", icon: MapPin, roles: ["SUPER_ADMIN"] },
    { name: "Universities", href: "/admin/universities", icon: GraduationCap, roles: ["SUPER_ADMIN"] },
    { name: "Templates", href: "/admin/templates", icon: MessageSquareIcon, roles: ["SUPER_ADMIN"] },
    { name: "Zoho CRM", href: "/admin/zoho", icon: UsersIcon, roles: ["SUPER_ADMIN"] },
    { name: "Admin Users", href: "/admin/users", icon: ShieldCheckIcon, roles: ["SUPER_ADMIN"] },
];

export function AdminSidebar({ user }: { user: any }) {
    const pathname = usePathname();
    const filteredItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-gray-900 text-white md:flex">
            <div className="flex h-16 items-center border-b border-gray-800 px-6">
                <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
                    <span className="text-purple-400 text-2xl">🎓</span>
                    <span>Admin Panel</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-4">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-gray-800 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-400 hover:bg-red-400/10 hover:text-red-400"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}

export function AdminMobileNav({ user }: { user: any }) {
    const pathname = usePathname();
    const filteredItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-white px-4 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-2">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-gray-900 border-r-0 p-0 text-white">
                    <div className="flex h-16 items-center border-b border-gray-800 px-6">
                        <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
                            <span className="text-purple-400 text-2xl">🎓</span>
                            <span>Admin Panel</span>
                        </Link>
                    </div>

                    <nav className="flex-1 space-y-1 px-4 py-4">
                        {filteredItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/admin" && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-purple-600 text-white"
                                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-red-400 hover:bg-red-400/10 hover:text-red-400"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <div className="flex flex-1 items-center justify-between">
                <Link href="/admin" className="flex items-center gap-2 font-bold">
                    <span className="text-purple-600">🎓</span>
                    <span>Admin</span>
                </Link>
            </div>
        </header>
    );
}
