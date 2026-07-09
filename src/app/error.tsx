"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import SiteFooter from "@/components/layout/SiteFooter";
import { SUPPORT_EMAIL, mailtoLink } from "@/lib/contact";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative min-h-screen flex flex-col bg-canvas text-ink font-geist">
      <header className="border-b border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AuraPTE" className="w-8 h-8 rounded-lg shadow-md object-cover" />
            <span className="text-lg font-bold tracking-tight text-ink">
              Aura<span className="bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end bg-clip-text text-transparent">PTE</span>
            </span>
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center py-16 sm:py-24">
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-error-soft border border-hairline flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-mono uppercase tracking-wider text-mute">Something went wrong</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              An unexpected error occurred
            </h1>
            <p className="text-sm sm:text-base text-mute leading-relaxed">
              We hit a snag loading this page. You can try again, or head back to the homepage.
            </p>
            {error.digest && (
              <p className="text-2xs font-mono text-mute">Error ID: {error.digest}</p>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-on-primary font-semibold shadow-vercel-popover hover:bg-opacity-90 active:scale-[0.99] transition cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft-2 text-ink font-semibold transition"
            >
              <Home className="w-4 h-4" />
              Back to home
            </Link>
          </div>

          <div className="pt-2 flex items-start gap-2 p-3 bg-canvas-soft border border-hairline rounded-lg text-xs text-mute leading-relaxed text-left">
            <span>
              If this keeps happening, email us at{" "}
              <a href={mailtoLink()} className="text-link hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              and mention what you were doing when it broke.
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
