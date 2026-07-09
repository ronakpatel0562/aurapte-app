import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import fs from "fs";
import path from "path";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import SupabaseSetupRequired from "@/components/layout/SupabaseSetupRequired";
import NavigationLoader from "@/components/layout/NavigationLoader";
import DisableContextMenu from "@/components/layout/DisableContextMenu";
import { ThemeProvider, themeInitScript } from "@/components/providers/ThemeProvider";
import SupportWidget from "@/components/support/SupportWidget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "AuraPTE — Premium PTE Core Prep",
  description: "Experience the next generation of PTE Core exam preparation — built to help PR aspirants hit CLB 10 for maximum CRS points, and students reach the score their university needs.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configured = isSupabaseConfigured();

  if (!configured) {
    let schemaSql = "";
    try {
      const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
      schemaSql = fs.readFileSync(schemaPath, "utf8");
    } catch (error) {
      console.error("Failed to read schema.sql", error);
    }

    return (
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <head>
          {/* Inline init runs before paint so the dark class is set on the
              very first render — no flash. */}
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <meta name="theme-color" content="#fafafa" />
        </head>
        <body className="bg-[#0a0a0a] min-h-screen flex flex-col font-geist antialiased">
          <SupabaseSetupRequired schemaSql={schemaSql} />
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-DTD9TMMXLF"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-DTD9TMMXLF');
            `}
          </Script>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Inline init runs before paint so the dark class is set on the
            very first render — no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="theme-color" content="#fafafa" />
      </head>
      <body className="bg-canvas-soft text-ink min-h-screen flex flex-col font-geist antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DTD9TMMXLF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DTD9TMMXLF');
          `}
        </Script>
        <ThemeProvider>
          <DisableContextMenu />
          <NavigationLoader />
          {children}
          <SupportWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
