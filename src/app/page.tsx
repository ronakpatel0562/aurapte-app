import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Mic,
  PenTool,
  BookOpenCheck,
  Headphones,
  Sparkles,
  Zap,
  Globe,
  Shield,
  Check,
  Award,
  Star,
  Quote,
} from "lucide-react";
import HeroScene from "@/components/landing/HeroSceneDynamic";
import { PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  // Authenticated users skip the marketing page.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-canvas text-ink font-geist">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-canvas/70 border-b border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AuraPTE" className="w-8 h-8 rounded-lg shadow-md object-cover" />
            <span className="text-lg font-bold tracking-tight text-ink">
              Aura<span className="bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end bg-clip-text text-transparent">PTE</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
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
          </nav>
        </div>
      </header>

      {/* ------------------ HERO ------------------ */}
      <section className="relative isolate">
        {/* Aurora gradient layer */}
        <div className="landing-aurora" aria-hidden="true" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_40%,transparent_100%)] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: copy + CTA */}
            <div className="space-y-7 reveal-up">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body shadow-vercel-card">
                <Sparkles className="w-3 h-3 text-gradient-brand-start" />
                Now with 12 practice &amp; 15 mock tests
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
                The PTE prep platform that
                <span className="block bg-gradient-to-r from-gradient-brand-start via-gradient-brand-mid to-gradient-brand-end bg-clip-text text-transparent">
                  surrounds you with focus.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-mute leading-relaxed max-w-xl">
                AuraPTE is a complete PTE Academic preparation platform — real exam simulations,
                module-by-module practice, AI-style scoring, and progress tracking that
                actually tells you where you stand.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link
                  href="#pricing"
                  className="pulse-ring inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-on-primary font-semibold shadow-vercel-popover hover:bg-opacity-90 active:scale-[0.99] transition"
                >
                  Choose your plan
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft-2 text-ink font-semibold transition"
                >
                  I already have an account
                </Link>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-2xs text-mute pt-2">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-success" />
                  Real exam-format simulation
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-success" />
                  Simple bank transfer / UPI payment
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-success" />
                  Cancel anytime
                </span>
              </div>
            </div>

            {/* Right: 3D scene */}
            <div className="relative h-[360px] sm:h-[460px] lg:h-[520px]">
              <HeroScene />
              {/* Floating stat cards layered over the 3D scene */}
              <div className="absolute top-6 left-4 sm:left-8 hidden sm:block">
                <div className="bg-canvas/90 backdrop-blur border border-hairline rounded-xl p-3 shadow-vercel-popover max-w-[180px]">
                  <div className="text-2xs font-mono uppercase tracking-wider text-mute">
                    Score accuracy
                  </div>
                  <div className="text-2xl font-bold text-ink mt-0.5">92%</div>
                  <div className="text-2xs text-success font-semibold">+18% this month</div>
                </div>
              </div>
              <div className="absolute bottom-8 right-4 sm:right-12 hidden sm:block">
                <div className="bg-canvas/90 backdrop-blur border border-hairline rounded-xl p-3 shadow-vercel-popover max-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-3.5 h-3.5 text-warning-deep" />
                    <span className="text-2xs font-mono uppercase tracking-wider text-mute">
                      PTE-aligned
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    Real exam timer &amp; format
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2 hidden md:block">
                <div className="bg-canvas/90 backdrop-blur border border-hairline rounded-xl p-3 shadow-vercel-popover">
                  <div className="text-2xs font-mono uppercase tracking-wider text-mute mb-2">
                    Modules
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { icon: Mic, label: "Speaking" },
                      { icon: PenTool, label: "Writing" },
                      { icon: BookOpenCheck, label: "Reading" },
                      { icon: Headphones, label: "Listening" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-canvas-soft-2 border border-hairline"
                      >
                        <Icon className="w-3 h-3 text-mute" />
                        <span className="text-2xs font-medium text-ink">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------ MARQUEE STATS ------------------ */}
      <section className="relative border-y border-hairline bg-canvas-soft overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-6 gap-12 text-2xs font-mono uppercase tracking-wider text-mute">
          {[...Array(2)].flatMap((_, dup) =>
            [
              "220+ LISTENING AUDIO FILES",
              "12 PRACTICE TESTS",
              "15 FULL MOCK TESTS",
              "AURA STARTER · ₹33,499/MO",
              "AURA PRO · ₹46,999/MO",
              "4 MODULES · 20+ TASK TYPES",
              "CLOUD-RENDERED AUDIO",
              "REAL EXAM TIMER",
              "MOBILE · TABLET · DESKTOP",
              "DARK MODE INCLUDED",
            ].map((s, i) => (
              <span key={`${dup}-${i}`} className="flex items-center gap-12">
                <span>{s}</span>
                <span className="text-hairline-strong">●</span>
              </span>
            ))
          )}
        </div>
      </section>

      {/* ------------------ MODULES ------------------ */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3 reveal-up">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Zap className="w-3 h-3" />
              Every module, every task type
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Built around the actual PTE exam
            </h2>
            <p className="text-base text-mute leading-relaxed">
              Each module mirrors the real PTE structure, with the same task types, scoring,
              and timing you&apos;ll face on test day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: Mic,
                name: "Speaking",
                gradient: "from-gradient-develop-start to-gradient-develop-end",
                count: 5,
                desc: "Read Aloud, Repeat Sentence, Describe Image, Respond to Situation, Answer Short Question",
              },
              {
                icon: PenTool,
                name: "Writing",
                gradient: "from-gradient-preview-start to-gradient-preview-end",
                count: 2,
                desc: "Summarize Written Text, Write an Email — both with word-count enforcement",
              },
              {
                icon: BookOpenCheck,
                name: "Reading",
                gradient: "from-gradient-ship-start to-gradient-ship-end",
                count: 5,
                desc: "Fill in the Blanks, Re-order Paragraphs, Multiple Choice single & multiple",
              },
              {
                icon: Headphones,
                name: "Listening",
                gradient: "from-gradient-develop-start to-gradient-preview-start",
                count: 7,
                desc: "Summarize Spoken Text, MCQ, Fill Blanks, Highlight Incorrect Words, Write from Dictation",
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.name}
                  className="card-hover bg-canvas border border-hairline rounded-2xl p-6 shadow-vercel-card flex flex-col gap-4 overflow-hidden relative"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.gradient}`} />
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-ink">{m.name}</h3>
                    <p className="text-2xs font-mono uppercase tracking-wider text-mute">
                      {m.count} task types
                    </p>
                  </div>
                  <p className="text-sm text-mute leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------ FEATURE GRID ------------------ */}
      <section className="relative py-20 sm:py-28 bg-canvas-soft border-y border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Shield className="w-3 h-3" />
              Engineered for results
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: "Real exam timer",
                desc: "2-hour countdown for mock tests with auto-submit. Practice tests stay self-paced.",
                icon: Award,
              },
              {
                title: "Instant scoring",
                desc: "See your score on every question, plus score history and progress stats on Pro.",
                icon: Shield,
              },
              {
                title: "Audio that loads instantly",
                desc: "Cloud-streamed audio from Cloudflare R2 — zero buffering, even on slow networks.",
                icon: Globe,
              },
              {
                title: "Works everywhere",
                desc: "Phone, tablet, laptop, desktop. Dark mode included. Your progress syncs.",
                icon: Zap,
              },
              {
                title: "Specialised Tips PDF",
                desc: "Curated PDF guide — Describe Image templates, WFD strategy, and more.",
                icon: Sparkles,
              },
              {
                title: "Cancel anytime",
                desc: "No lock-in, no commitment. Just don't renew next month.",
                icon: Check,
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="card-hover bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card space-y-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center">
                    <Icon className="w-4 h-4 text-ink" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
                  <p className="text-xs text-mute leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------ TESTIMONIALS ------------------ */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3 reveal-up">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Star className="w-3 h-3 text-gradient-brand-start" />
              Loved by test-takers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Real prep, real results
            </h2>
            <p className="text-base text-mute leading-relaxed">
              A few candidates who used AuraPTE to prepare for their PTE Academic exam.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                quote:
                  "The mock tests felt exactly like the real exam — same timer, same interface. I walked into test day with zero surprises.",
                name: "Ananya Sharma",
                role: "Scored 82 overall · Melbourne",
              },
              {
                quote:
                  "I was stuck at 65 in Speaking for weeks. The instant scoring on Read Aloud and Repeat Sentence showed me exactly what to fix.",
                name: "Rahul Mehta",
                role: "Scored 79 overall · Sydney",
              },
              {
                quote:
                  "Practicing Write from Dictation and Summarize Spoken Text on here made Listening my strongest section by far.",
                name: "Priya Nair",
                role: "Scored 85 overall · Toronto",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="card-hover bg-canvas border border-hairline rounded-2xl p-6 shadow-vercel-card flex flex-col gap-4"
              >
                <Quote className="w-6 h-6 text-gradient-brand-start" />
                <p className="text-sm text-body leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-hairline">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gradient-brand-start to-gradient-brand-end flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{t.name}</div>
                    <div className="text-2xs text-mute">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------ PRICING ------------------ */}
      <section id="pricing" className="relative py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Simple pricing
            </h2>
            <p className="text-base text-mute leading-relaxed">
              Pick a plan and get full access from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[PLANS.free, PLANS.premium].map((plan) => {
              const isFeatured = plan.id === "premium";
              return (
                <div
                  key={plan.id}
                  className={`card-hover relative bg-canvas border rounded-2xl p-6 sm:p-7 shadow-vercel-card flex flex-col ${
                    isFeatured ? "border-gradient-brand-start/40 ring-1 ring-gradient-brand-start/20" : "border-hairline"
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-3 left-6 px-2.5 py-1 rounded-full bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end text-white text-2xs font-mono font-semibold uppercase tracking-wider shadow-vercel-card">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-ink">{plan.name}</h3>
                  <p className="text-sm text-mute leading-relaxed mt-1">{plan.tagline}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-ink">
                      ₹{plan.priceInr.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-mute">/ {plan.billingPeriod}</span>
                  </div>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-body">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-success/10 text-success">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link
                      href="/signup"
                      className={`w-full h-11 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${
                        isFeatured
                          ? "bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end text-white hover:opacity-95 active:scale-[0.99]"
                          : "border border-hairline bg-canvas hover:bg-canvas-soft-2 text-ink"
                      }`}
                    >
                      Get started
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------ FOOTER ------------------ */}
      <footer className="relative border-t border-hairline bg-canvas-soft py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AuraPTE" className="w-7 h-7 rounded-lg shadow-sm object-cover" />
            <span className="text-sm font-bold text-ink">
              Aura<span className="bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end bg-clip-text text-transparent">PTE</span>
            </span>
          </div>
          <p className="text-2xs text-mute">
            © {new Date().getFullYear()} AuraPTE · Built for PTE Academic candidates
          </p>
        </div>
      </footer>
    </main>
  );
}
