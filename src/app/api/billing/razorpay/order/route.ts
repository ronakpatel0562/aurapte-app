import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, getRazorpayCredentials } from "@/lib/razorpay";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * POST /api/billing/razorpay/order
 *
 * Creates a Razorpay order for the requested plan. Returns the
 * order_id + key_id that the client needs to open the checkout widget.
 *
 * Body: { planId: "premium" }
 *
 * This route is authenticated — the resulting order is tied to the
 * caller's user_id, which is what the webhook uses to flip the plan.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { planId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const planId = body.planId as PlanId | undefined;
  const plan = planId ? PLANS[planId] : undefined;
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }
  if (!plan.isPaid || plan.priceInr <= 0) {
    return NextResponse.json({ error: "Plan is not paid" }, { status: 400 });
  }

  const credentials = getRazorpayCredentials();
  if (!credentials.configured) {
    return NextResponse.json(
      {
        error:
          "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.",
        code: "RAZORPAY_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  try {
    const order = await createRazorpayOrder({
      planId: plan.id,
      amountPaise: plan.priceInr * 100,
      currency: "INR",
      receipt: `aurapte_${plan.id}_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        planId: plan.id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: credentials.keyId,
      planName: plan.name,
    });
  } catch (err: any) {
    console.error("Razorpay order error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create order" },
      { status: 500 }
    );
  }
}
