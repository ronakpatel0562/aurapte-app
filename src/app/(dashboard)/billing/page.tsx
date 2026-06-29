import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronRight, Sparkles, Award, Lock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import { PLANS, planName, isPremiumPlan, formatPrice, type PlanId } from "@/lib/plans";
import RazorpayCheckout from "@/components/billing/RazorpayCheckout";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect(`/login${searchParams?.from ? `?next=/billing` : ""}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expiry")
    .eq("id", user.id)
    .maybeSingle();
  const currentPlan = ((profile?.plan as PlanId) || "free") as PlanId;
  const isPremium = isPremiumPlan(currentPlan);

  const configured = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;

  // Sort: free first, then premium.
  const orderedPlans = [PLANS.free, PLANS.premium];

  return (
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-4 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">Plans &amp; Billing</span>
      </div>

      {/* Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-ink" />
          <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">
            Choose your plan
          </h1>
        </div>
        <p className="text-sm text-mute leading-relaxed">
          You&apos;re currently on{" "}
          <span className="font-semibold text-ink">{planName(currentPlan)}</span>.
          {isPremium && profile?.plan_expiry && (
            <>
              {" "}Renews on{" "}
              <span className="font-mono text-body">
                {new Date(profile.plan_expiry).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              .
            </>
          )}
        </p>
      </div>

      {/* Plan cards — Aura Starter on the left, Aura Pro on the right.
          On phones they stack; on tablets+ they sit side by side. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {orderedPlans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPaid = plan.id === "premium";
          return (
            <div
              key={plan.id}
              className={`card-hover relative bg-canvas border rounded-2xl p-6 sm:p-7 shadow-vercel-card flex flex-col ${
                isPaid
                  ? "border-gradient-preview-start/40 ring-1 ring-gradient-preview-start/20"
                  : "border-hairline"
              }`}
            >
              {isPaid && (
                <div className="absolute -top-3 left-6 px-2.5 py-1 rounded-full bg-gradient-to-r from-gradient-preview-start to-gradient-preview-end text-white text-2xs font-mono font-semibold uppercase tracking-wider shadow-vercel-card">
                  Most Popular
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${isPaid ? "text-gradient-preview-start" : "text-mute"}`} />
                  <h2 className="text-xl font-semibold text-ink">{plan.name}</h2>
                  {isCurrent && (
                    <span className="text-2xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-mute leading-relaxed">{plan.tagline}</p>
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink tracking-tight">
                  {plan.priceInr === 0 ? "Free" : `₹${plan.priceInr.toLocaleString("en-IN")}`}
                </span>
                {plan.priceInr > 0 && (
                  <span className="text-sm text-mute">/ {plan.billingPeriod}</span>
                )}
              </div>

              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-body">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isPaid ? "bg-gradient-preview-start/10 text-gradient-preview-start" : "bg-success/10 text-success"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-5 border-t border-hairline">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full h-11 rounded-lg border border-hairline bg-canvas-soft-2 text-mute text-sm font-semibold cursor-not-allowed"
                  >
                    Your current plan
                  </button>
                ) : isPaid ? (
                  <RazorpayCheckout planId={plan.id} configured={configured} />
                ) : (
                  <Link
                    href="/dashboard"
                    className="w-full h-11 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft-2 text-ink text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    Continue with Starter
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Test-mode notice — only when keys are missing. */}
      {!configured && (
        <div className="bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-warning-deep">
            <Lock className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Running in &ldquo;keys-missing&rdquo; mode</h3>
          </div>
          <p className="text-xs text-mute leading-relaxed">
            The billing UI is fully built but the &ldquo;Upgrade&rdquo; button is disabled until you
            set <code className="font-mono text-2xs">RAZORPAY_KEY_ID</code> and{" "}
            <code className="font-mono text-2xs">RAZORPAY_KEY_SECRET</code> in your environment.
            You can grab test keys from{" "}
            <a
              href="https://dashboard.razorpay.com/app/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:underline"
            >
              dashboard.razorpay.com/app/keys
            </a>{" "}
            (use the Test mode toggle) — the test card{" "}
            <code className="font-mono text-2xs">4111 1111 1111 1111</code> will simulate a successful
            payment without real money.
          </p>
        </div>
      )}

      {/* FAQ / reassurance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {[
          { title: "Cancel anytime", body: "No lock-in. Stop your subscription in one click from your dashboard." },
          { title: "UPI supported", body: "Pay with any UPI app, plus cards, netbanking, and wallets." },
          { title: "Receipts by email", body: "Every payment generates a GST-compliant invoice for your records." },
        ].map((item) => (
          <div key={item.title} className="bg-canvas border border-hairline rounded-xl p-4 shadow-vercel-card">
            <h3 className="text-sm font-semibold text-ink mb-1">{item.title}</h3>
            <p className="text-2xs text-mute leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
