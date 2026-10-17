import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
    title: "snipstack — a home for your code",
    description: "Keep the code. Build the idea.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en">
            <body>
            <div className="ss-root">
                <Navbar />
                {children}
                <Footer />
            </div>
            </body>
            </html>
        </ClerkProvider>
    );
}