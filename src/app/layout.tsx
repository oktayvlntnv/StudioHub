import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PWARegister } from "@/components/PWARegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StudioHub Private",
    template: "%s | StudioHub Private",
  },
  description:
    "A private, legal-first personal streaming portal for owner-managed sources.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/studiohub-icon.svg",
    apple: "/icons/studiohub-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#050709] text-slate-100">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
