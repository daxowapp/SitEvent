import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Kiosk Mode - SitConnect",
    description: "Event Registration Kiosk",
};

export default function KioskLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white overflow-hidden">
            {children}
        </div>
    );
}
