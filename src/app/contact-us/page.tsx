import type { Metadata } from "next";
import { Mail, Clock } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import StaticPageNav from "@/components/layout/StaticPageNav";
import ContactForm from "@/components/support/ContactForm";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink, mailtoLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Us — AuraPTE | PTE Academic Prep Support",
  description:
    "Get in touch with the AuraPTE team by email or WhatsApp for support with your PTE Academic practice account, billing, prediction files, or general questions — whether or not you've purchased a plan.",
  alternates: { canonical: "https://aurapte.com/contact-us" },
  openGraph: {
    title: "Contact Us — AuraPTE",
    description: "Reach the AuraPTE team by email or WhatsApp for support, billing, or general questions about PTE Academic prep.",
    url: "https://aurapte.com/contact-us",
    type: "website",
  },
};

export default function ContactUsPage() {
  return (
    <main className="relative min-h-screen bg-canvas text-ink font-geist">
      <SiteHeader />
      <StaticPageNav current="/contact-us" />

      <section className="relative py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
            <Mail className="w-3 h-3 text-gradient-brand-start" />
            Contact AuraPTE
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
            We&apos;re here to help
          </h1>
          <p className="text-base sm:text-lg text-mute leading-relaxed max-w-2xl">
            Question before you buy, a billing issue, or a doubt about a specific module or
            question? Reach out any time by email, WhatsApp, or the form below — no purchase
            required.
          </p>
        </div>
      </section>

      <section className="relative py-12 sm:py-16 border-t border-hairline bg-canvas-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <a
              href={whatsappLink("Hi AuraPTE team, I have a question about")}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-canvas border border-hairline rounded-xl p-6 space-y-3 hover:border-hairline-strong transition"
            >
              <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
                <WhatsAppIcon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-ink">WhatsApp</h2>
              <p className="text-xs text-mute leading-relaxed">
                Fastest way to reach us — for quick questions before or after purchase.
              </p>
              <span className="text-sm font-medium text-link">{SUPPORT_WHATSAPP_DISPLAY}</span>
              <span className="block text-2xs text-mute">WhatsApp only — this number doesn&apos;t take calls.</span>
            </a>

            <a
              href={mailtoLink()}
              className="bg-canvas border border-hairline rounded-xl p-6 space-y-3 hover:border-hairline-strong transition"
            >
              <div className="w-10 h-10 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center">
                <Mail className="w-4 h-4 text-ink" />
              </div>
              <h2 className="text-sm font-semibold text-ink">Email</h2>
              <p className="text-xs text-mute leading-relaxed">
                For account access, billing, refunds, or general questions.
              </p>
              <span className="text-sm font-medium text-link break-all">{SUPPORT_EMAIL}</span>
            </a>

            <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center">
                <Clock className="w-4 h-4 text-ink" />
              </div>
              <h2 className="text-sm font-semibold text-ink">Response time</h2>
              <p className="text-xs text-mute leading-relaxed">
                Email replies within 24–48 hours on business days. WhatsApp is usually faster.
                Payment-related queries are prioritised.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">Send us a message</h2>
            <p className="text-sm text-mute">
              Fill this in and it goes straight to our team&apos;s inbox — we reply from there.
            </p>
            <ContactForm />
          </div>

          <p className="text-xs text-mute leading-relaxed">
            For payment verification specifically, include your registered email and the
            transaction reference so we can locate your claim faster.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
