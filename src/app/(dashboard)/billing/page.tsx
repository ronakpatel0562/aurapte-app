import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronRight, Sparkles, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import { PLANS, planName, isPremiumPlan, type PlanId } from "@/lib/plans";
import BankPaymentPanel from "@/components/billing/BankPaymentPanel";

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
  // profiles.plan defaults to "free" for every signup regardless of payment
  // — it only reflects the *label* of the plan an admin last activated, not
  // whether that plan is currently paid for. Whether a plan is "current" (and
  // therefore not purchasable again) must also require a non-expired
  // plan_expiry, otherwise a brand-new unpaid user sees Starter marked
  // "Current" with the purchase button hidden and has no way to ever pay.
  const hasActivePlan =
    !!profile?.plan_expiry && new Date(profile.plan_expiry).getTime() > Date.now();

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
          {hasActivePlan ? (
            <>
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
            </>
          ) : (
            <>You don&apos;t have an active plan yet — choose one below to get started.</>
          )}
        </p>
      </div>

      {/* Plan cards — both paid, Aura Starter on the left, Aura Pro (featured)
          on the right. On phones they stack; on tablets+ side by side. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {orderedPlans.map((plan) => {
          const isCurrent = plan.id === currentPlan && hasActivePlan;
          const isFeatured = plan.id === "premium";
          return (
            <div
              key={plan.id}
              className={`card-hover relative bg-canvas border rounded-2xl p-6 sm:p-7 shadow-vercel-card flex flex-col ${
                isFeatured
                  ? "border-gradient-brand-start/40 ring-1 ring-gradient-brand-start/20"
                  : "border-hairline"
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-6 px-2.5 py-1 rounded-full bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end text-white text-2xs font-mono font-semibold uppercase tracking-wider shadow-vercel-card">
                  Most Popular
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${isFeatured ? "text-gradient-brand-start" : "text-mute"}`} />
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
                  ₹{plan.priceInr.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-mute">/ {plan.billingPeriod}</span>
              </div>

              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-body">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isFeatured ? "bg-gradient-brand-start/10 text-gradient-brand-start" : "bg-success/10 text-success"
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
                ) : (
                  <BankPaymentPanel
                    planId={plan.id}
                    planName={plan.name}
                    label={
                      plan.priceInr < PLANS[currentPlan].priceInr
                        ? `Get payment details to switch to ${plan.name}`
                        : `Get payment details for ${plan.name}`
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ / reassurance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {[
          { title: "Manual activation", body: "Pay by bank transfer or UPI, then email us your payment proof." },
          { title: "Activated within 24 hours", body: "We confirm your payment and switch your plan by hand." },
          { title: "Cancel anytime", body: "No lock-in. Just don't renew next month — no auto-billing." },
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
