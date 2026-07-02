/**
 * Plan model — single source of truth for tier names, pricing, and feature
 * gates. Two plans:
 *   - "free" → "Aura Starter" — limited access, no payment needed
 *   - "premium" → "Aura Pro" — full access, paid via Razorpay
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
    tagline: "Get started with the essentials — perfect for first-time PTE takers.",
    priceInr: 0,
    billingPeriod: "free",
    razorpayPlanId: "",
    isPaid: false,
    features: [
      "10 Practice Tests (focused, short-form)",
      "5 Full Mock Tests (PTE-simulated)",
      "Unlimited single-module practice questions",
      "Score history & recent activity dashboard",
      "Reading & Writing Fill in the Blanks scoring",
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
    priceInr: 999,
    billingPeriod: "month",
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID ?? "",
    isPaid: true,
    features: [
      "All 30 Practice Tests, unlimited retries",
      "All 10 Full Mock Tests with timer + scoring",
      "Specialised Tips PDF (Describe Image templates, WFD strategy, …)",
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
