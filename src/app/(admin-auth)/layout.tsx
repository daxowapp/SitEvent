import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
});

export const metadata: Metadata = {
    title: "EduFairs - Login",
    description: "Event Management Platform",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${playfair.variable} font-sans antialiased text-gray-900 bg-gray-50`}>
                {children}
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
