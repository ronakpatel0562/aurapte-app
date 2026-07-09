import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home, LifeBuoy, SearchX } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { SUPPORT_EMAIL, mailtoLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Page Not Found — AuraPTE",
  description: "The page you're looking for doesn't exist or may have moved.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex flex-col bg-canvas text-ink font-geist">
      <SiteHeader />

      <section className="flex-1 flex items-center justify-center py-16 sm:py-24">
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-canvas-soft-2 border border-hairline flex items-center justify-center">
            <SearchX className="w-6 h-6 text-mute" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-mono uppercase tracking-wider text-mute">404</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              We couldn&apos;t find that page
            </h1>
            <p className="text-sm sm:text-base text-mute leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or may have moved. Double-check
              the link, or head back to somewhere familiar.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-on-primary font-semibold shadow-vercel-popover hover:bg-opacity-90 active:scale-[0.99] transition"
            >
              <Home className="w-4 h-4" />
              Back to home
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft-2 text-ink font-semibold transition"
            >
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-2 flex items-start gap-2 p-3 bg-canvas-soft border border-hairline rounded-lg text-xs text-mute leading-relaxed text-left">
            <LifeBuoy className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Still stuck? Email us at{" "}
              <a href={mailtoLink()} className="text-link hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              and we&apos;ll help you find what you need.
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
