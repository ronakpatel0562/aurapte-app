/**
 * Plan model — single source of truth for tier names, pricing, and feature
 * gates. Both tiers are paid, no free access:
 *   - "free" (internal id, unchanged for DB compatibility) → "Aura Starter"
 *   - "premium" → "Aura Pro" — full access
 *
 * Payment is collected manually (bank transfer / UPI), not through a payment
 * gateway — see src/components/billing/BankPaymentPanel.tsx. An admin flips
 * profiles.plan by hand once payment is confirmed.
 *
 * The feature list for each tier must match what src/lib/plans.ts actually
 * gates elsewhere in the app (hasAccessToTest, isPremiumPlan, per-question
 * score locks, dark mode, etc.) — don't add bullets that aren't backed by
 * real enforcement, that's how billing copy drifts from reality.
 *
 * Anywhere in the codebase that needs the friendly name, price, or feature
 * list should import from here. Don't hardcode "Plan 1" / "Plan 2" anywhere
 * else — that's the kind of drift that makes billing screens lie.
 *
 * priceCad/originalPriceCad are display-only (shown alongside the INR price
 * for international visitors) — all actual payment is still collected in INR
 * via BankPaymentPanel, so update both currencies together when repricing.
 */

export type PlanId = "free" | "premium";

export interface PlanDefinition {
  id: PlanId;
  /** Display name shown to users. */
  name: string;
  /** One-line tagline. */
  tagline: string;
  /** Price in INR. 0 = free tier. */
  priceInr: number;
  /** Pre-discount "strikethrough" price in INR shown alongside priceInr. */
  originalPriceInr: number;
  /** Price in CAD, shown alongside priceInr for international visitors. 0 = free tier. */
  priceCad: number;
  /** Pre-discount "strikethrough" price in CAD shown alongside priceCad. */
  originalPriceCad: number;
  /** Billing period label, e.g. "month", "one-time". */
  billingPeriod: string;
  /** Whether this tier shows the upgrade CTA. */
  isPaid: boolean;
  /** Ordered list of feature bullets shown on the billing page. */
  features: string[];
  /** Module/test access caps (null = unlimited). */
  limits: {
    practiceTests: number | null;
    mockTests: number | null;
    questionsPerModule: number | null;
  };
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Aura Starter",
    tagline: "A focused set of practice and mock tests to get you started.",
    priceInr: 34500,
    originalPriceInr: 39000,
    priceCad: 500,
    originalPriceCad: 600,
    billingPeriod: "month",
    isPaid: true,
    features: [
      "Full Question Bank access",
      "10 Practice Tests & 5 Mock Tests",
      "Prediction Files & Specialised Tips",
      "Real exam timer & interface",
    ],
    limits: {
      practiceTests: 10,
      mockTests: 5,
      questionsPerModule: null,
    },
  },
  premium: {
    id: "premium",
    name: "Aura Pro",
    tagline: "Unlimited tests with full scoring and progress tracking.",
    priceInr: 47500,
    originalPriceInr: 75000,
    priceCad: 700,
    originalPriceCad: 1120,
    billingPeriod: "month",
    isPaid: true,
    features: [
      "Everything in Starter, plus:",
      "Unlimited Practice Tests",
      "15 Full Mock Tests",
      "Random Practice Test Generation",
      "See your score on every question",
      "Full Score History",
      "Filter by difficulty & completion status",
      "Dashboard Stats & Dark Mode",
    ],
    limits: {
      practiceTests: null,
      mockTests: null,
      questionsPerModule: null,
    },
  },
};

/** Discount percent off originalPriceInr, rounded to the nearest whole number. */
export function discountPercent(plan: PlanDefinition): number {
  if (!plan.originalPriceInr || plan.originalPriceInr <= plan.priceInr) return 0;
  return Math.round(
    ((plan.originalPriceInr - plan.priceInr) / plan.originalPriceInr) * 100,
  );
}

/**
 * Returns the display name for a plan id. Falls back to the id itself so
 * unknown future plans never throw — they just render "pro" or whatever.
 */
export function planName(id: string | null | undefined): string {
  if (!id) return PLANS.free.name;
  return PLANS[id as PlanId]?.name ?? id;
}

/** True when the user's plan unlocks a feature that the free tier caps. */
export function isPremiumPlan(id: string | null | undefined): boolean {
  return id === "premium";
}

/** True if the user has access to a 1-indexed test number in a given track. */
export function hasAccessToTest(
  planId: string | null | undefined,
  track: "practiceTests" | "mockTests",
  testNumber: number,
): boolean {
  const plan = PLANS[(planId as PlanId) ?? "free"];
  if (!plan) return false;
  const cap = plan.limits[track];
  if (cap === null) return true;
  return testNumber <= cap;
}

/** Formatted price string for display ("₹999/mo" or "Free"). */
export function formatPrice(plan: PlanDefinition): string {
  if (plan.priceInr === 0) return "Free";
  return `₹${plan.priceInr.toLocaleString("en-IN")} / ${plan.billingPeriod}`;
}

/** Formatted CAD price string for display ("$540 CAD / month" or "Free"). */
export function formatPriceCad(plan: PlanDefinition): string {
  if (plan.priceCad === 0) return "Free";
  return `$${plan.priceCad.toLocaleString("en-CA")} CAD / ${plan.billingPeriod}`;
}
