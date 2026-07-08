import Link from "next/link";
import { Home } from "lucide-react";

const LINKS: { label: string; href: string }[] = [
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

/**
 * Slim cross-link bar shown under the header on About/Contact/Privacy/Terms
 * so a visitor can jump straight between them or back to the homepage,
 * without having to scroll to the footer.
 */
export default function StaticPageNav({ current }: { current: string }) {
  return (
    <div className="border-b border-hairline bg-canvas-soft">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center gap-1 overflow-x-auto">
        <Link
          href="/"
          className="shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium text-body hover:text-ink hover:bg-canvas-soft-2 transition"
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
        <span className="shrink-0 text-hairline-strong">/</span>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 px-3 h-7 inline-flex items-center rounded-full text-xs font-medium transition whitespace-nowrap ${
              link.href === current
                ? "bg-canvas-soft-2 text-ink"
                : "text-body hover:text-ink hover:bg-canvas-soft-2"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
