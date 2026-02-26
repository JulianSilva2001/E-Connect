import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Connect",
  description:
    "Connect with mentors and mentees in the Department of Electronics & Telecommunication at the University of Moratuwa",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/E-Connect-logo-small-modified.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    shortcut: "/E-Connect-logo-small-modified.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
