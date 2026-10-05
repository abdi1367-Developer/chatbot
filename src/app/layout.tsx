import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { botConfig } from "@/config/bot.config";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: {
    default: `${botConfig.branding.botName} | ${botConfig.branding.companyName}`,
    template: `%s | ${botConfig.branding.companyShortName}`,
  },
  description:
    "دستیار هوشمند پاسخ‌گوی سؤالات متداول مرکز مبادله ارز و طلای ایران؛ حراج سکه، سامانه ارز تجاری، بازار متشکل ارز، ارز اربعین و خدمات پشتیبانی.",
  keywords: [
    "مرکز مبادله",
    "حراج سکه طلا",
    "بازار متشکل ارز ایران",
    "ارز تجاری",
    "ارز اربعین",
    "ارز دانشجویی",
    "چت‌بات",
  ],
  authors: [{ name: botConfig.branding.companyName }],
  icons: {
    icon: [{ url: botConfig.branding.logo }],
    shortcut: botConfig.branding.logo,
    apple: botConfig.branding.logo,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: botConfig.branding.primaryColor },
    { media: "(prefers-color-scheme: dark)", color: botConfig.branding.primaryColor },
  ],
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
