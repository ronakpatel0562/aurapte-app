import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import StaticPageNav from "@/components/layout/StaticPageNav";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink, mailtoLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Terms & Conditions — AuraPTE",
  description:
    "Read the Terms & Conditions for using AuraPTE's PTE Core exam preparation platform, including account rules, billing, and acceptable use.",
  alternates: { canonical: "https://aurapte.com/terms-and-conditions" },
  openGraph: {
    title: "Terms & Conditions — AuraPTE",
    description: "The terms that govern your use of AuraPTE's PTE Core prep platform.",
    url: "https://aurapte.com/terms-and-conditions",
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

export default function TermsAndConditionsPage() {
  return (
    <main className="relative min-h-screen bg-canvas text-ink font-geist">
      <SiteHeader />
      <StaticPageNav current="/terms-and-conditions" />

      <section className="relative py-16 sm:py-20 border-b border-hairline">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">Terms &amp; Conditions</h1>
          <p className="text-sm text-mute">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="relative py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Section title="1. Acceptance of terms">
            <p>
              By creating an account or using AuraPTE (aurapte.com), you agree to these Terms &amp;
              Conditions. If you do not agree, please do not use the Service.
            </p>
          </Section>

          <Section title="2. The Service">
            <p>
              AuraPTE provides PTE Core exam preparation tools, including a question bank,
              practice tests, full-length mock tests, instant AI-assisted scoring, and prediction
              file downloads. AuraPTE is an independent preparation platform and is not affiliated
              with, endorsed by, or connected to Pearson PLC or the official PTE Core exam.
            </p>
          </Section>

          <Section title="3. Accounts">
            <p>
              You must provide accurate information when creating an account and are responsible
              for keeping your login credentials secure. You are responsible for all activity that
              occurs under your account.
            </p>
          </Section>

          <Section title="4. Plans and payment">
            <p>
              AuraPTE is a paid service — there is no free tier. All plans are activated via
              manual bank transfer or UPI payment, verified against the transaction reference you
              submit. Access is granted once your payment claim is verified. Prices, features, and
              billing periods are as shown on the Pricing section at the time of purchase and may
              change for future billing cycles. If you have a question about a plan before you buy,
              contact us at{" "}
              <a href={mailtoLink()} className="text-link hover:underline">{SUPPORT_EMAIL}</a> or on
              WhatsApp at{" "}
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                {SUPPORT_WHATSAPP_DISPLAY}
              </a>{" "}
              (WhatsApp only) — you don&apos;t need to have purchased anything to reach out.
            </p>
          </Section>

          <Section title="5. Cancellations and refunds">
            <p>
              Premium plans can be cancelled at any time by simply not renewing for the next
              billing period — there is no lock-in. Because plans are billed manually and access is
              granted immediately on verification, payments already verified and activated are
              generally non-refundable, except where required by applicable law or at our
              discretion in cases of duplicate or erroneous payment. Contact{" "}
              <a href="mailto:support@aurapte.com" className="text-link hover:underline">support@aurapte.com</a>{" "}
              for billing issues.
            </p>
          </Section>

          <Section title="6. Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Share your account credentials or resell access to the Service</li>
              <li>Copy, redistribute, or resell question content, mock tests, or prediction files</li>
              <li>Attempt to disrupt, reverse-engineer, or scrape the Service</li>
              <li>Use the Service for any unlawful purpose</li>
            </ul>
          </Section>

          <Section title="7. Intellectual property">
            <p>
              All content on AuraPTE — including questions, mock tests, prediction files, audio,
              and platform design — is owned by AuraPTE or its licensors and is provided for your
              personal exam-preparation use only.
            </p>
          </Section>

          <Section title="8. Prediction files disclaimer">
            <p>
              Prediction files are compiled from recently reported exam questions and patterns to
              guide your preparation. They are a study aid, not a guarantee — actual exam content
              is set by Pearson and may differ. AuraPTE does not guarantee any specific exam score.
            </p>
          </Section>

          <Section title="9. Limitation of liability">
            <p>
              AuraPTE is provided &quot;as is&quot;. To the fullest extent permitted by law, we are not
              liable for any indirect, incidental, or consequential damages arising from your use
              of the Service, including exam outcomes.
            </p>
          </Section>

          <Section title="10. Changes to these terms">
            <p>
              We may update these Terms from time to time. Continued use of the Service after
              changes take effect constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions about these Terms? Email{" "}
              <a href={mailtoLink()} className="text-link hover:underline">{SUPPORT_EMAIL}</a> or message us on
              WhatsApp at{" "}
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                {SUPPORT_WHATSAPP_DISPLAY}
              </a>{" "}
              (WhatsApp only, not for calls).
            </p>
          </Section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
