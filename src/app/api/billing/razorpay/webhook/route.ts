import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyRazorpaySignature } from "@/lib/razorpay";
/**
 * POST /api/billing/razorpay/webhook
 *
 * Razorpay calls this on every payment event. We care about
 * "payment.captured" — when the payment succeeds. The handler:
 *   1. Verifies the HMAC signature so attackers can't forge a success.
 *   2. Extracts user_id + planId from the order notes.
 *   3. Updates the user's profile to the new plan.
 *
 * Uses the SERVICE ROLE key because the request comes from Razorpay with
 * no user session — only the signature proves authenticity. The service
 * role bypasses RLS, which is what we want for a server-to-server update.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpaySignatureFromBody(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload?.event;
  if (event !== "payment.captured") {
    // We only act on payment.captured. Other events are acknowledged so
    // Razorpay doesn't retry, but we don't take action.
    return NextResponse.json({ received: true, ignored: event });
  }

  const notes = payload?.payload?.payment?.entity?.notes ?? {};
  const userId = notes.userId;
  const planId = notes.planId;

  if (!userId || !planId) {
    return NextResponse.json({ error: "Missing userId/planId in notes" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const planExpiry = new Date();
  planExpiry.setMonth(planExpiry.getMonth() + 1); // 1-month subscription

  const { error } = await admin
    .from("profiles")
    .update({
      plan: planId,
      plan_expiry: planExpiry.toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Webhook DB update failed:", error);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, userId, planId });
}

/**
 * Razorpay signs the entire request body, not just (order_id|payment_id).
 * The signature is `HMAC_SHA256(body, key_secret)` hex-encoded.
 */
function verifyRazorpaySignatureFromBody(body: string, signature: string): boolean {
  if (!signature) return false;
  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) return false;
  // Lazy import so this module stays edge-runtime safe.
  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getRazorpayCredentials() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return { keySecret };
}
