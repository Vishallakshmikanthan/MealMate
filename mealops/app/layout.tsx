import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  applicationName: "MealOps",
  title: {
    default: "MealOps — Smart Mess Companion",
    template: "%s | MealOps",
  },
  description:
    "Track nutrition, scan food with AI, and chat your way to better meals — all offline, no API required.",
  keywords: ["meal planning", "nutrition tracking", "food scanner", "offline AI", "canteen menu", "diet tracker"],
  authors: [{ name: "MealOps" }],
  openGraph: {
    type: "website",
    siteName: "MealOps",
    title: "MealOps — Smart Mess Companion",
    description: "Track nutrition, scan food with AI, and chat your way to better meals — fully offline.",
  },
  robots: {
    index: false, // private app — no public indexing needed
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-foreground antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
