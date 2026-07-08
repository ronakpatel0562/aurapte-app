import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import StaticPageNav from "@/components/layout/StaticPageNav";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink, mailtoLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy Policy — AuraPTE",
  description:
    "Read AuraPTE's privacy policy to understand how we collect, use, and protect your account, practice, and payment data on our PTE Academic prep platform.",
  alternates: { canonical: "https://aurapte.com/privacy-policy" },
  openGraph: {
    title: "Privacy Policy — AuraPTE",
    description: "How AuraPTE collects, uses, and protects your data.",
    url: "https://aurapte.com/privacy-policy",
    type: "website",
  },
};

const LAST_UPDATED = "8 July 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
      <div className="text-sm text-mute leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="relative min-h-screen bg-canvas text-ink font-geist">
      <SiteHeader />
      <StaticPageNav current="/privacy-policy" />

      <section className="relative py-16 sm:py-20 border-b border-hairline">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">Privacy Policy</h1>
          <p className="text-sm text-mute">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="relative py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Section title="1. Introduction">
            <p>
              AuraPTE (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides an online PTE Academic exam
              preparation platform at aurapte.com, including question practice, mock tests,
              instant scoring, and prediction files (the &quot;Service&quot;). This policy explains what
              information we collect when you use the Service, how we use it, and the choices you
              have.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p><strong className="text-ink">Account information:</strong> when you sign up, we collect your name, email address, and authentication credentials via our authentication provider (Supabase).</p>
            <p><strong className="text-ink">Practice data:</strong> your answers, recordings, and scores for Speaking, Writing, Reading, and Listening tasks, so we can show your progress and history.</p>
            <p><strong className="text-ink">Microphone recordings:</strong> Speaking tasks (Read Aloud, Repeat Sentence, Describe Image, and others) require microphone access to record your response for scoring. Recordings are stored to generate your score and are not shared publicly.</p>
            <p><strong className="text-ink">Payment information:</strong> AuraPTE plans are paid via bank transfer or UPI. We collect the transaction reference and amount you submit to verify your payment claim. We do not collect or store your card, UPI PIN, or bank login credentials.</p>
            <p><strong className="text-ink">Usage data:</strong> device type, browser, pages visited, and general usage patterns, collected to keep the Service reliable and to improve it.</p>
            <p><strong className="text-ink">Local storage:</strong> we use your browser&apos;s local storage to remember preferences such as theme (light/dark) and audio volume.</p>
          </Section>

          <Section title="3. How we use your information">
            <p>We use the information above to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and operate your account and practice history</li>
              <li>Score your Speaking, Writing, Reading, and Listening responses</li>
              <li>Verify bank transfer / UPI payment claims and activate your plan</li>
              <li>Send you service-related communications (e.g. payment confirmation)</li>
              <li>Maintain, secure, and improve the Service</li>
            </ul>
          </Section>

          <Section title="4. How we store and protect data">
            <p>
              Account and practice data is stored with Supabase (PostgreSQL). Audio files are
              stored via Cloudflare R2. We apply reasonable technical and organisational measures
              to protect your data, including row-level access controls on your account data.
              No method of transmission or storage is 100% secure, but we work to protect your
              information to industry standards.
            </p>
          </Section>

          <Section title="5. Sharing of information">
            <p>
              We do not sell your personal information. We share data only with the service
              providers necessary to run AuraPTE (authentication, database, and file storage
              providers listed above), or where required by law.
            </p>
          </Section>

          <Section title="6. Cookies and local storage">
            <p>
              We use essential cookies/local storage to keep you signed in and to remember your
              preferences. We do not use third-party advertising trackers.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>
              You may request access to, correction of, or deletion of your personal data at any
              time by contacting us at{" "}
              <a href={mailtoLink()} className="text-link hover:underline">{SUPPORT_EMAIL}</a>{" "}
              or on WhatsApp at{" "}
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                {SUPPORT_WHATSAPP_DISPLAY}
              </a>{" "}
              (WhatsApp only — not for calls). You can also delete practice recordings by
              contacting support.
            </p>
          </Section>

          <Section title="8. Children&apos;s privacy">
            <p>
              AuraPTE is intended for users preparing for the PTE Academic exam, typically 16 years
              or older. We do not knowingly collect data from children under 13.
            </p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              reflected by updating the &quot;Last updated&quot; date above.
            </p>
          </Section>

          <Section title="10. Contact us">
            <p>
              Questions about this policy? Email{" "}
              <a href={mailtoLink()} className="text-link hover:underline">{SUPPORT_EMAIL}</a> or message us on
              WhatsApp at{" "}
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                {SUPPORT_WHATSAPP_DISPLAY}
              </a>{" "}
              (WhatsApp only). You can also use the form on our{" "}
              <a href="/contact-us" className="text-link hover:underline">Contact Us</a> page.
            </p>
          </Section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
