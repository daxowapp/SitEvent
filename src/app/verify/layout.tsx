import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "../globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Document Verification | SitConnect",
    description:
        "Verify the authenticity of official documents issued by SitConnect.",
};

export default function VerifyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
