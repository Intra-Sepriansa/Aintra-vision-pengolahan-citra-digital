import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

import { AppProviders } from "@/components/app-providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIntra Vision - Pengolahan Citra Digital",
  description:
    "Toolkit 13 operasi pengolahan citra dengan animasi modern, Next.js App Router, Tailwind, dan FastAPI backend.",
  applicationName: "AIntra Vision",
  keywords: [
    "pengolahan citra",
    "image processing",
    "Next.js",
    "FastAPI",
    "CLAHE",
    "Canny",
    "Gamma Correction",
  ],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  metadataBase: new URL("https://aintra.local"),
  openGraph: {
    title: "AIntra Vision",
    description:
      "Deretan 13 operasi pengolahan citra digital, dan backend FastAPI.",
    url: "https://aintra.local",
    siteName: "AIntra Vision",
    images: [
      {
        url: "/aintra.png",
        width: 512,
        height: 512,
        alt: "Logo AIntra",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIntra Vision",
    description:
      "Toolkit pengolahan citra digital dengan 13 operasi, background task, dan progress WebSocket.",
    images: ["/aintra.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body
        className={cn(
          "min-h-screen bg-white text-neutral-900 antialiased",
          plusJakarta.variable,
        )}
      >
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1" id="beranda">
              {children}
            </main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
