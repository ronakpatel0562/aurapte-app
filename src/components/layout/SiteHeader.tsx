import Link from "next/link";
import LandingThemeToggle from "@/components/landing/LandingThemeToggle";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/auth-cache";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-canvas/70 border-b border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="AuraPTE" className="w-8 h-8 rounded-lg shadow-md object-cover" />
          <span className="text-lg font-bold tracking-tight text-ink">
            Aura<span className="bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end bg-clip-text text-transparent">PTE</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <LandingThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="h-9 px-4 inline-flex items-center gap-1.5 bg-primary text-on-primary text-sm font-semibold rounded-md hover:bg-opacity-90 active:scale-[0.99] transition"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex h-9 px-4 items-center text-sm font-medium text-body hover:text-ink transition rounded-md"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="h-9 px-4 inline-flex items-center gap-1.5 bg-primary text-on-primary text-sm font-semibold rounded-md hover:bg-opacity-90 active:scale-[0.99] transition"
              >
                Get started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
