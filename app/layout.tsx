import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://school.shiviiii.com'),
  title: {
    template: "%s | EduCore System",
    default: "EduCore School Management System",
  },
  description: "Next-generation cloud ERP empowering education through seamless administration, analytics, and intelligent automation.",
  keywords: ["schoolstudylpu", "studylpu", "sms", "EduCore", "School Management System"],
  authors: [{ name: "Shivam Kumar Singh" }],
  openGraph: {
    title: "EduCore School Management System",
    description: "Empowering Education Through Technology. The ultimate digital ERP for modern schools.",
    url: "https://school.shiviiii.com",
    siteName: "EduCore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduCore System",
    description: "Next-generation cloud ERP for schools.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { QueryProvider } from "@/components/providers/QueryProvider";

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans min-h-[100dvh] bg-background text-text-primary antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
