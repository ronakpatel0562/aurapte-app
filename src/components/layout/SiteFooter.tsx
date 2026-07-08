import Link from "next/link";

const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-hairline bg-canvas-soft py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AuraPTE" className="w-7 h-7 rounded-lg shadow-sm object-cover" />
            <span className="text-sm font-bold text-ink">
              Aura<span className="bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end bg-clip-text text-transparent">PTE</span>
            </span>
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-mute">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-ink transition">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-2xs text-mute text-center sm:text-left">
          © {new Date().getFullYear()} AuraPTE · Built for PTE Academic candidates
        </p>
      </div>
    </footer>
  );
}
