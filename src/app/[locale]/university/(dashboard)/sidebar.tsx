"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/university/global-search";
import {
    LayoutDashboard,
    Search,
    LogOut,
    Menu,
    QrCode,
    BarChart3,
    Users,
    Calendar
} from "lucide-react";

const navItems = [
    { name: "Overview", href: "/university/dashboard", icon: LayoutDashboard },
    { name: "My Events", href: "/university/events", icon: Calendar },
    { name: "Analytics", href: "/university/analytics", icon: BarChart3 },
    { name: "Global Leads", href: "/university/leads", icon: Users },
    { name: "Lead Scanner", href: "/university/scan", icon: QrCode },
    { name: "Event Market", href: "/university/explore", icon: Search },
];

// Animation variants - using const assertions for proper TypeScript compatibility
const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
            staggerChildren: 0.08,
            delayChildren: 0.2
        }
    }
};

const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 24
        }
    }
};

const logoVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25
        }
    }
};

export function UniversitySidebar({ user }: { user: any }) {
    const pathname = usePathname();

    const NavContent = () => (
        <motion.div 
            className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-white/5 text-white"
            initial="hidden"
            animate="visible"
            variants={sidebarVariants}
        >
            {/* Logo Section */}
            <motion.div 
                className="flex h-20 items-center px-6 gap-3 border-b border-white/5 bg-white/[0.02]"
                variants={logoVariants}
            >
                <motion.div 
                    className="relative w-10 h-10"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <Image 
                        src="/logo-red.svg" 
                        alt="Sit Connect" 
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                    />
                </motion.div>
                <div>
                    <motion.span 
                        className="font-display font-bold text-lg tracking-wide block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
                    >
                        Sit Connect
                    </motion.span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">University Portal</span>
                </div>
            </motion.div>

            {/* Global Search */}
            <motion.div 
                className="px-4 py-3 border-b border-white/5"
                variants={navItemVariants}
            >
                <GlobalSearch />
            </motion.div>

            {/* Navigation */}
            <motion.div className="flex-1 px-4 py-8 space-y-1.5">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.href}
                            variants={navItemVariants}
                            custom={index}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "text-white"
                                        : "text-white/50 hover:text-white"
                                )}
                            >
                                {/* Active background */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg shadow-red-900/30"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ 
                                                type: "spring", 
                                                stiffness: 300, 
                                                damping: 25 
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                                
                                {/* Hover background */}
                                {!isActive && (
                                    <motion.div
                                        className="absolute inset-0 bg-white/0 rounded-xl group-hover:bg-white/5"
                                        transition={{ duration: 0.2 }}
                                    />
                                )}
                                
                                <Icon className={cn(
                                    "h-5 w-5 transition-all relative z-10",
                                    isActive 
                                        ? "text-white" 
                                        : "text-white/40 group-hover:text-white/80"
                                )} />
                                <span className="relative z-10">{item.name}</span>
                                
                                {/* Active indicator dot */}
                                {isActive && (
                                    <motion.div
                                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/80"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                                    />
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* User Section */}
            <motion.div 
                className="p-4 border-t border-white/5 bg-gradient-to-t from-black/20 to-transparent"
                variants={navItemVariants}
            >
                <motion.div 
                    className="mb-4 px-4 py-3.5 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-sm"
                    whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.15)" }}
                    transition={{ duration: 0.2 }}
                >
                    <p className="text-[10px] text-red-400 uppercase font-bold tracking-[0.15em] mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Signed in as
                    </p>
                    <p className="text-sm font-medium truncate text-white/90">{user.email}</p>
                </motion.div>
                <motion.div
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-white/40 hover:bg-red-600/10 hover:text-red-400 transition-all duration-300 h-12 rounded-xl group"
                        onClick={() => signOut({ callbackUrl: "/university/login" })}
                    >
                        <LogOut className="h-4 w-4 group-hover:rotate-[-10deg] transition-transform duration-300" />
                        Sign Out
                    </Button>
                </motion.div>
            </motion.div>
        </motion.div>
    );

    return (
        <>
            {/* Mobile Nav */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 z-40 flex items-center px-4 justify-between">
                <Sheet>
                    <SheetTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </motion.div>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 border-0 bg-transparent">
                        <NavContent />
                    </SheetContent>
                </Sheet>
                <div className="font-bold flex items-center gap-2.5 text-white">
                    <motion.div
                        className="relative w-8 h-8"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                    >
                        <Image 
                            src="/logo-red.svg" 
                            alt="Sit Connect" 
                            width={32}
                            height={32}
                            className="w-full h-full object-contain"
                        />
                    </motion.div>
                    <span className="font-display">Sit Connect</span>
                </div>
                <div className="w-10" />
            </div>

            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col md:flex">
                <NavContent />
            </aside>
        </>
    );
}
