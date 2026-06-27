import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import fs from "fs";
import path from "path";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import SupabaseSetupRequired from "@/components/layout/SupabaseSetupRequired";
import NavigationLoader from "@/components/layout/NavigationLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "AuraPTE — Premium PTE Academic Prep",
  description: "Experience the next generation of PTE Academic exam preparation, styled by design engineers.",
  // Icons are declared via files in src/app/ (icon.png, apple-icon.png).
  // Next.js auto-generates the <link> tags and route handlers — that
  // works on Vercel out of the box.
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
        <body className="bg-[#0a0a0a] min-h-screen flex flex-col font-geist antialiased">
          <SupabaseSetupRequired schemaSql={schemaSql} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-canvas-soft text-ink min-h-screen flex flex-col font-geist antialiased">
        <NavigationLoader />
        {children}
      </body>
    </html>
  );
}

