import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, Sparkles, ShieldCheck, Users, LifeBuoy } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import StaticPageNav from "@/components/layout/StaticPageNav";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink, mailtoLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "About Us — AuraPTE | PTE Academic Prep Platform",
  description:
    "AuraPTE is a PTE Academic exam preparation platform built for students targeting Australia, UK, Canada, and New Zealand. Learn about our mission, the team, and how we help you score 79+.",
  alternates: { canonical: "https://aurapte.com/about-us" },
  openGraph: {
    title: "About Us — AuraPTE",
    description:
      "Learn about AuraPTE's mission to help PTE Academic candidates prepare smarter with real exam simulation, instant AI scoring, and curated prediction files.",
    url: "https://aurapte.com/about-us",
    type: "website",
  },
};

export default function AboutUsPage() {
  return (
    <main className="relative min-h-screen bg-canvas text-ink font-geist">
      <SiteHeader />
      <StaticPageNav current="/about-us" />

      <section className="relative py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
            <Sparkles className="w-3 h-3 text-gradient-brand-start" />
            About AuraPTE
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
            Helping PTE Academic candidates prepare with confidence
          </h1>
          <p className="text-base sm:text-lg text-mute leading-relaxed">
            AuraPTE is a PTE Academic exam preparation platform built for students working toward
            university admission or migration to Australia, the UK, Canada, and New Zealand. We
            combine a large, exam-accurate question bank with real-format mock tests, instant
            AI-assisted scoring, and curated prediction files — so you always know where you
            stand and what to fix next.
          </p>
        </div>
      </section>

      <section className="relative py-12 sm:py-16 border-t border-hairline bg-canvas-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Our mission</h2>
            <p className="text-base text-mute leading-relaxed">
              A PTE Academic score is often the single biggest gate standing between a student and
              their university offer or migration visa. We built AuraPTE because too much PTE
              prep content online is generic, outdated, or locked behind expensive coaching
              packages. Our goal is to give every candidate access to exam-realistic practice,
              transparent scoring, and up-to-date prediction material at a fair, affordable price —
              and to be genuinely reachable when they have a question, whether or not they&apos;ve
              purchased a plan yet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: Target,
                title: "Exam-accurate practice",
                desc: "Every task type mirrors the real Pearson interface, timer, and scoring rubric.",
              },
              {
                icon: ShieldCheck,
                title: "Honest, instant feedback",
                desc: "AI-assisted scoring benchmarked against the official rubric — no guesswork.",
              },
              {
                icon: Users,
                title: "Built with real test-takers",
                desc: "Question sets and prediction files shaped by feedback from recent candidates.",
              },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-canvas border border-hairline rounded-xl p-5 space-y-2">
                  <Icon className="w-5 h-5 text-gradient-brand-start" />
                  <h3 className="text-sm font-semibold text-ink">{v.title}</h3>
                  <p className="text-xs text-mute leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-ink">What we offer</h2>
            <p className="text-base text-mute leading-relaxed">
              A question bank covering Speaking, Writing, Reading, and Listening across every PTE
              Academic task type, full-length mock tests with real exam timing, practice tests you
              can generate on demand, and monthly-updated prediction files for students sitting
              the exam soon. AuraPTE works on desktop, tablet, and mobile, with dark mode included.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-on-primary font-semibold shadow-vercel-popover hover:bg-opacity-90 active:scale-[0.99] transition"
            >
              Choose a plan
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft-2 text-ink font-semibold transition"
            >
              <LifeBuoy className="w-4 h-4" />
              Talk to us first
            </Link>
          </div>

          <div className="pt-2 flex items-start gap-2 p-3 bg-canvas border border-hairline rounded-lg text-xs text-mute leading-relaxed">
            <LifeBuoy className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Have a question before you commit? Email{" "}
              <a href={mailtoLink()} className="text-link hover:underline">{SUPPORT_EMAIL}</a> or WhatsApp{" "}
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                {SUPPORT_WHATSAPP_DISPLAY}
              </a>{" "}
              (WhatsApp only, not for calls) — no purchase needed.
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
