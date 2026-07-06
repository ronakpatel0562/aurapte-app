/**
 * Plan model — single source of truth for tier names, pricing, and feature
 * gates. Both tiers are paid, no free access:
 *   - "free" (internal id, unchanged for DB compatibility) → "Aura Starter"
 *   - "premium" → "Aura Pro" — full access, paid via Razorpay
 *
 * Starter is priced off a 550 CAD/mo target, converted to INR (~61 INR/CAD)
 * since Razorpay settles in INR. Pro is priced ~40% above Starter so the
 * jump to "everything unlocked" reads as a small step up, not a new decision.
 *
 * Anywhere in the codebase that needs the friendly name, price, or feature
 * list should import from here. Don't hardcode "Plan 1" / "Plan 2" anywhere
 * else — that's the kind of drift that makes billing screens lie.
 */

export type PlanId = "free" | "premium";

export interface PlanDefinition {
  id: PlanId;
  /** Display name shown to users. */
  name: string;
  /** One-line tagline. */
  tagline: string;
  /** Price in INR (paise for Razorpay = price * 100). 0 = free tier. */
  priceInr: number;
  /** Billing period label, e.g. "month", "one-time". */
  billingPeriod: string;
  /** Razorpay Plan ID (set in Razorpay dashboard after creating plans).
   *  Empty until you wire up a real Razorpay account — that's fine, the
   *  checkout button will display a "Payment not configured" notice. */
  razorpayPlanId: string;
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
    tagline: "Everything you need to start scoring higher on PTE Academic.",
    priceInr: 33499,
    billingPeriod: "month",
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID ?? "",
    isPaid: true,
    features: [
      "10 Practice Tests (focused, short-form)",
      "5 Full Mock Tests (PTE-simulated)",
      "Unlimited single-module practice questions",
      "Score history & recent activity dashboard",
      "Reading & Writing Fill in the Blanks scoring",
      "Specialised Tips & Templates (Describe Image, WFD strategy, …)",
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
    tagline: "Unlock everything — full mock library, all specialised tips, and AI scoring.",
    priceInr: 46999,
    billingPeriod: "month",
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID ?? "",
    isPaid: true,
    features: [
      "Everything in Aura Starter, unlimited retries",
      "All Practice Tests and Full Mock Tests, no caps",
      "Unlimited questions across every module",
      "Score breakdown per question and per module",
      "Priority access to new question packs",
    ],
    limits: {
      practiceTests: null,
      mockTests: null,
      questionsPerModule: null,
    },
  },
};

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
