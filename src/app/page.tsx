import React from "react";
import Image from "next/image";
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
  Rocket,
  Compass,
  Target,
  Brain,
} from "lucide-react";
import HeroDashboardMockup from "@/components/landing/HeroDashboardMockup";
import HeroMockup from "@/components/landing/HeroMockup";
import { WritingMockup, ReadingMockup, ListeningMockup } from "@/components/landing/ModuleMockups";
import ScrollToPricingLink from "@/components/landing/ScrollToPricingLink";
import ScrollReveal from "@/components/landing/ScrollReveal";
import ScrollProgressBar from "@/components/landing/ScrollProgressBar";
import ParallaxLayer from "@/components/landing/ParallaxLayer";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink, mailtoLink } from "@/lib/contact";
import { PLANS, discountPercent } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How can I score 79+ in PTE Core?",
    answer:
      "Scoring 79+ takes consistent, exam-format practice across all four skills — not just grammar or vocabulary study. Focus on templates for Describe Image and Summarize Written Text, drill Read Aloud and Repeat Sentence for fluency and pronunciation, and take full-length mock tests under real exam timing so test-day pressure doesn't cost you marks. AuraPTE's question bank and instant scoring are built specifically to help you find and fix weak task types quickly.",
  },
  {
    question: "Is PTE Core easier than IELTS?",
    answer:
      "Many candidates find PTE Core easier than IELTS because it's fully computer-scored — there's no live examiner, which removes a lot of the speaking-interview anxiety. Pearson's AI scores speaking on fluency and pronunciation, not on accent, so a strong Indian accent does not lower your score as long as it's clear and natural. Results also arrive faster, typically within 1-2 business days.",
  },
  {
    question: "What is a PTE prediction file and how accurate is it?",
    answer:
      "A PTE prediction file is a curated list of recently repeated exam questions — Read Aloud texts, Repeat Sentence audio, Write from Dictation sentences, Essay topics, and more — compiled from real candidates' post-exam reports. Because the question pool shifts month to month, prediction files are only useful when refreshed regularly. AuraPTE's prediction files are updated to reflect current exam patterns rather than left stale.",
  },
  {
    question: "How many PTE mock tests should I take before the exam?",
    answer:
      "Most candidates benefit from 3-5 full-length mock tests in the two weeks before their exam, alongside daily task-specific practice. Mock tests build the stamina to stay accurate across the full 2-hour exam and help you get comfortable with the real interface and timer, which is exactly what AuraPTE's mock tests are modeled on.",
  },
  {
    question: "What PTE score do I need for Australia, Canada, UK, or New Zealand?",
    answer:
      "Requirements vary by visa or university pathway. For Canada Express Entry, only PTE Core — not the general PTE Academic test — is accepted by IRCC for CLB scoring; a CLB 10 (Level 10) result across all four skills maximizes your CRS points. For Australia, Competent English generally requires at least 47 in Listening, 48 in Reading, 54 in Speaking, and 51 in Writing, while Superior English (for maximum migration points) requires around 69-88 across bands. Always check the current threshold for your specific visa subclass or university offer, since these are updated periodically.",
  },
  {
    question: "Does AuraPTE offer AI scoring for Speaking and Writing?",
    answer:
      "Yes. Every Speaking response (Read Aloud, Repeat Sentence, Describe Image, and more) and Writing task (Summarize Written Text, Write an Email) is scored automatically within seconds, benchmarked against the official PTE Core rubric, so you get accurate feedback without waiting on a human reviewer.",
  },
  {
    question: "Does AuraPTE have a free plan?",
    answer:
      "No — AuraPTE doesn't have a free tier. Both plans are paid: Aura Starter and Aura Pro, billed monthly with no lock-in, so you can cancel anytime by simply not renewing. If you'd like to understand what's included before you commit, email or WhatsApp us and we'll walk you through it.",
  },
  {
    question: "How do I get support if I have a question or doubt?",
    answer:
      "Reach out any time by email or WhatsApp — you don't need to have purchased a plan first. We help with questions before you buy, billing issues, and doubts about any module or specific question. Look for the support button in the corner of every page, or visit the Contact Us page.",
  },
  {
    question: "Which PTE Core task types can I practice on AuraPTE?",
    answer:
      "All of them: Speaking (Read Aloud, Repeat Sentence, Describe Image, Respond to a Situation, Answer Short Question), Writing (Summarize Written Text, Write an Email), Reading (Fill in the Blanks, Multiple Choice, Re-order Paragraphs), and Listening (Summarize Spoken Text, Multiple Choice, Fill in the Blanks, Highlight Incorrect Words, Select Missing Word, Write from Dictation).",
  },
];

const LANDING_THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('aurapte-landing-theme');
    var dark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) {
      var root = document.getElementById('landing-root');
      if (root) root.classList.add('dark');
    }
  } catch (_) {}
})();
`;

export default async function LandingPage() {
  // Authenticated users skip the marketing page.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main id="landing-root" className="relative min-h-screen overflow-x-hidden bg-canvas text-ink font-geist">
      <script dangerouslySetInnerHTML={{ __html: LANDING_THEME_INIT_SCRIPT }} />

      <SiteHeader />
      <ScrollProgressBar />

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
            <ParallaxLayer speed={0.06} fade className="space-y-7 reveal-up">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body shadow-vercel-card">
                <Sparkles className="w-3 h-3 text-gradient-brand-start" />
                Now with 30 practice &amp; 15 mock tests
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
                The PTE prep platform that
                <span className="block bg-gradient-to-r from-gradient-brand-start via-gradient-brand-mid to-gradient-brand-end bg-clip-text text-transparent">
                  surrounds you with focus.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-mute leading-relaxed max-w-xl">
                AuraPTE is a complete PTE Core preparation platform — built first for PR
                aspirants chasing CLB 10 and maximum CRS points, and just as effective for
                students working toward their university&apos;s PTE score. Real exam simulations,
                module-by-module practice, automated scoring, and progress tracking that
                actually tells you where you stand.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <ScrollToPricingLink className="pulse-ring inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-on-primary font-semibold shadow-vercel-popover hover:bg-opacity-90 active:scale-[0.99] transition">
                  Choose your plan
                  <ArrowRight className="w-4 h-4" />
                </ScrollToPricingLink>
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

              {/* Quick links to key pages, for crawlability and easy access */}
              <nav aria-label="Quick links" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs text-mute pt-1">
                <Link href="/about-us" className="hover:text-ink transition underline-offset-2 hover:underline">
                  About Us
                </Link>
                <Link href="/contact-us" className="hover:text-ink transition underline-offset-2 hover:underline">
                  Contact Us
                </Link>
                <Link href="/privacy-policy" className="hover:text-ink transition underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms-and-conditions" className="hover:text-ink transition underline-offset-2 hover:underline">
                  Terms &amp; Conditions
                </Link>
              </nav>
            </ParallaxLayer>

            {/* Right: 3D hero mockup */}
            <ParallaxLayer speed={0.03}>
              <HeroDashboardMockup />
            </ParallaxLayer>
          </div>
        </div>
      </section>

      {/* ------------------ MARQUEE STATS ------------------ */}
      <section className="relative border-y border-hairline bg-canvas-soft overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-6 gap-12 text-2xs font-mono uppercase tracking-wider text-mute">
          {[...Array(2)].flatMap((_, dup) =>
            [
              "220+ LISTENING AUDIO FILES",
              "30 PRACTICE TESTS",
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

      {/* ------------------ WHY CHOOSE AURAPTE ------------------ */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <ScrollReveal className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Target className="w-3 h-3 text-gradient-brand-start" />
              Why PR aspirants and students choose AuraPTE
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Everything you need to prepare smarter
            </h2>
            <p className="text-base text-mute leading-relaxed">
              Practice smarter, get feedback faster, and walk into test day with confidence.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                title: "Fast Processing",
                desc: "Every question is scored by AI in seconds, not days — so you always know where you stand.",
                gradient: "from-gradient-develop-start to-gradient-develop-end",
                icon: Rocket,
              },
              {
                title: "Easy Navigation",
                desc: "Practice on an interface modeled on the real PTE Core screens — no confusing test software to slow you down.",
                gradient: "from-gradient-preview-start to-gradient-preview-end",
                icon: Compass,
              },
              {
                title: "Precision Scoring",
                desc: "AI-powered scoring benchmarked against the real exam rubric, so your feedback is accurate and something you can trust.",
                gradient: "from-gradient-ship-start to-gradient-ship-end",
                icon: Target,
              },
              {
                title: "Integrated Skills",
                desc: "Tasks that blend Reading, Writing, Speaking, and Listening together — just like the real exam expects.",
                gradient: "from-gradient-develop-start to-gradient-preview-start",
                icon: Brain,
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <ScrollReveal key={f.title} delay={i * 80}>
                  <div className="card-hover bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card space-y-3 h-full">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
                    <p className="text-xs text-mute leading-relaxed">{f.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------ MODULES UP CLOSE ------------------ */}
      <section className="relative py-20 sm:py-28 bg-canvas-soft border-y border-hairline overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 sm:space-y-28">
          <ScrollReveal className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Sparkles className="w-3 h-3 text-gradient-brand-start" />
              See it before you sit it
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Every module, up close
            </h2>
            <p className="text-base text-mute leading-relaxed">
              The exact interface you&apos;ll practice on — modeled after the real PTE Core
              screens for each skill.
            </p>
          </ScrollReveal>

          {[
            {
              key: "speaking",
              icon: Mic,
              name: "Speaking",
              gradient: "from-gradient-develop-start to-gradient-develop-end",
              tasks: "Read Aloud, Repeat Sentence, Describe Image, Respond to Situation, Answer Short Question",
              desc: "Record into your mic just like on exam day. Every attempt is scored in seconds on pronunciation, fluency, and content.",
              mockup: <HeroMockup />,
            },
            {
              key: "writing",
              icon: PenTool,
              name: "Writing",
              gradient: "from-gradient-preview-start to-gradient-preview-end",
              tasks: "Summarize Written Text, Write an Email",
              desc: "A live word-count meter enforces the same limits as the real exam, so you build the habit of writing within range.",
              mockup: <WritingMockup />,
            },
            {
              key: "reading",
              icon: BookOpenCheck,
              name: "Reading",
              gradient: "from-gradient-ship-start to-gradient-ship-end",
              tasks: "Fill in the Blanks, Re-order Paragraphs, Multiple Choice single & multiple",
              desc: "Drag-and-drop paragraph reordering and click-to-fill blanks — the same interactions as the Pearson interface.",
              mockup: <ReadingMockup />,
            },
            {
              key: "listening",
              icon: Headphones,
              name: "Listening",
              gradient: "from-gradient-develop-start to-gradient-preview-start",
              tasks: "Summarize Spoken Text, MCQ, Fill Blanks, Highlight Incorrect Words, Write from Dictation",
              desc: "Cloud-streamed audio starts instantly, even on slow connections, so you never lose practice time to buffering.",
              mockup: <ListeningMockup />,
            },
          ].map((m, i) => {
            const Icon = m.icon;
            const reversed = i % 2 === 1;
            return (
              <div key={m.key} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <ScrollReveal className={reversed ? "lg:order-2" : ""}>
                  <div className="space-y-4 max-w-lg">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{m.name}</h3>
                    <p className="text-base text-mute leading-relaxed">{m.desc}</p>
                    <p className="text-xs font-mono uppercase tracking-wider text-mute pt-1">{m.tasks}</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={120} className={reversed ? "lg:order-1" : ""}>
                  {m.mockup}
                </ScrollReveal>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------ FEATURE GRID ------------------ */}
      <section className="relative py-20 sm:py-28 bg-canvas-soft border-y border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <ScrollReveal className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Shield className="w-3 h-3" />
              Engineered for results
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </ScrollReveal>

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
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <ScrollReveal key={f.title} delay={i * 70}>
                  <div className="card-hover bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card space-y-3 h-full">
                    <div className="w-9 h-9 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center">
                      <Icon className="w-4 h-4 text-ink" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
                    <p className="text-xs text-mute leading-relaxed">{f.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------ TESTIMONIALS ------------------ */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <ScrollReveal className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Star className="w-3 h-3 text-gradient-brand-start" />
              Loved by test-takers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Real prep, real results
            </h2>
            <p className="text-base text-mute leading-relaxed">
              A few candidates who used AuraPTE to prepare for their PTE Core exam.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                quote:
                  "Perfect target hit. The Writing templates for Summarize Written Text and Essay were the difference between a 79 and a 90.",
                name: "Karan Verma",
                role: "Scored 90 overall · Vancouver",
                avatar: "/testimonials/karan-verma.jpg",
              },
              {
                quote:
                  "The Reading drills — especially Reorder Paragraphs and Fill in the Blanks — took my score from 72 to 88 in three weeks.",
                name: "Meera Iyer",
                role: "Scored 88 overall · Auckland",
                avatar: "/testimonials/meera-iyer.jpg",
              },
              {
                quote:
                  "Practicing Write from Dictation and Summarize Spoken Text on here made Listening my strongest section by far.",
                name: "Priya Nair",
                role: "Scored 85 overall · Toronto",
                avatar: "/testimonials/priya-nair.jpg",
              },
              {
                quote:
                  "The mock tests felt exactly like the real exam — same timer, same interface. I walked into test day with zero surprises.",
                name: "Ananya Sharma",
                role: "Scored 82 overall · Melbourne",
                avatar: "/testimonials/ananya-sharma.jpg",
              },
              {
                quote:
                  "I was stuck at 65 in Speaking for weeks. The instant scoring on Read Aloud and Repeat Sentence showed me exactly what to fix.",
                name: "Rahul Mehta",
                role: "Scored 79 overall · Sydney",
                avatar: "/testimonials/rahul-mehta.jpg",
              },
              {
                quote:
                  "Random Practice Test Generation kept every session fresh — I never felt like I was just grinding the same five sets.",
                name: "Devansh Rao",
                role: "Scored 76 overall · Brisbane",
                avatar: "/testimonials/devansh-rao.jpg",
              },
            ].map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 90}>
                <div className="card-hover bg-canvas border border-hairline rounded-2xl p-6 shadow-vercel-card flex flex-col gap-4 h-full">
                  <Quote className="w-6 h-6 text-gradient-brand-start" />
                  <p className="text-sm text-body leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-hairline">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-hairline"
                    />
                    <div>
                      <div className="text-sm font-semibold text-ink">{t.name}</div>
                      <div className="text-2xs text-mute">{t.role}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------ MISSION ------------------ */}
      <section className="relative py-20 sm:py-28 bg-canvas-soft border-y border-hairline">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal className="space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Sparkles className="w-3 h-3 text-gradient-brand-start" />
              Our mission
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              We help you achieve your dreams
            </h2>
            <p className="text-base text-mute leading-relaxed">
              At AuraPTE, we&apos;re dedicated to helping PR aspirants hit CLB 10 for maximum CRS
              points, and helping students reach the score their university needs — both with
              confidence. Our platform offers a comprehensive range of carefully designed mock
              tests and practice sets that closely replicate the real test environment.
            </p>
            <p className="text-base text-mute leading-relaxed">
              Powered by AI-driven scoring, we give you instant, accurate, and detailed feedback
              on your performance — so you know exactly where you stand and what to work on next.
              With AuraPTE, you don&apos;t just practice — you prepare smarter, build confidence,
              and move closer to the score you need.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------ PRICING ------------------ */}
      <section id="pricing" className="relative py-20 sm:py-28 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <ScrollReveal id="pricing-heading" className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Simple pricing
            </h2>
            <p className="text-base text-mute leading-relaxed">
              Pick a plan and get full access from day one.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto md:items-stretch">
            {[PLANS.free, PLANS.premium].map((plan, i) => {
              const isFeatured = plan.id === "premium";
              const discount = discountPercent(plan);
              const savings = plan.originalPriceInr - plan.priceInr;
              return (
                <ScrollReveal key={plan.id} delay={i * 100} className="h-full">
                  <div
                    className={`card-hover relative h-full bg-canvas border rounded-2xl p-6 sm:p-7 pt-9 sm:pt-10 shadow-vercel-card flex flex-col ${
                      isFeatured ? "border-gradient-brand-start/40 ring-1 ring-gradient-brand-start/20" : "border-hairline"
                    }`}
                  >
                    {isFeatured ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end text-white text-2xs font-mono font-semibold uppercase tracking-wider shadow-vercel-card whitespace-nowrap">
                        Most Popular · Save {discount}%
                      </div>
                    ) : (
                      discount > 0 && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-canvas-soft-2 text-mute border border-hairline text-2xs font-mono font-semibold uppercase tracking-wider shadow-vercel-card whitespace-nowrap">
                          {discount}% OFF
                        </div>
                      )
                    )}
                    <h3 className="text-xl font-semibold text-ink">{plan.name}</h3>
                    <p className="text-sm text-mute leading-relaxed mt-1">{plan.tagline}</p>
                    <div className="mt-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-ink">
                          ₹{plan.priceInr.toLocaleString("en-IN")}
                        </span>
                        <span className="text-sm text-mute">/ {plan.billingPeriod}</span>
                      </div>
                      {discount > 0 && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-mute line-through">
                            ₹{plan.originalPriceInr.toLocaleString("en-IN")}
                          </span>
                          <span className={`text-xs font-semibold ${isFeatured ? "text-success" : "text-mute"}`}>
                            Save ₹{savings.toLocaleString("en-IN")} ({discount}% off)
                          </span>
                        </div>
                      )}
                    </div>
                    <ul className="mt-5 space-y-2.5">
                      {plan.features.map((f) =>
                        f.endsWith(":") ? (
                          <li key={f} className="pt-1 text-sm font-semibold text-ink">
                            {f}
                          </li>
                        ) : (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-body">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-success/10 text-success">
                              <Check className="w-3 h-3" />
                            </span>
                            <span className="leading-relaxed">{f}</span>
                          </li>
                        ),
                      )}
                    </ul>
                    <div className="mt-auto pt-6">
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
                </ScrollReveal>
              );
            })}
          </div>

          <p className="text-center text-sm text-mute">
            Not sure which plan fits? Email{" "}
            <a href={mailtoLink()} className="text-link hover:underline">{SUPPORT_EMAIL}</a> or WhatsApp{" "}
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
              {SUPPORT_WHATSAPP_DISPLAY}
            </a>{" "}
            — no purchase needed to ask.
          </p>
        </div>
      </section>

      {/* ------------------ FAQ ------------------ */}
      <section className="relative py-20 sm:py-28 border-t border-hairline">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <ScrollReveal className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-soft-2 border border-hairline text-2xs font-mono uppercase tracking-wider text-body">
              <Sparkles className="w-3 h-3 text-gradient-brand-start" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Frequently asked questions
            </h2>
            <p className="text-base text-mute leading-relaxed">
              Everything candidates ask us before starting PTE Core prep on AuraPTE.
            </p>
          </ScrollReveal>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={faq.question} delay={i * 40}>
                <details className="group bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card open:shadow-vercel-popover transition">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-semibold text-ink">
                    {faq.question}
                    <span className="shrink-0 w-6 h-6 rounded-full border border-hairline flex items-center justify-center text-mute text-xs transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-mute leading-relaxed">{faq.answer}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
