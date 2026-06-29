/**
 * Razorpay integration — server-side order creation + client-side checkout
 * launcher. We use Razorpay because it supports UPI/cards/netbanking in
 * INR out of the box, has a clean Node SDK, and sane webhook semantics.
 *
 * Flow:
 *   1. Client (BillingPage) clicks "Upgrade".
 *   2. POST /api/billing/razorpay/order with the plan id.
 *   3. Server creates a Razorpay order, returns order_id + key.
 *   4. Client opens Razorpay checkout with that order_id.
 *   5. On success, Razorpay POSTs to our webhook (/api/billing/razorpay/webhook)
 *      which flips the user's profile.plan to "premium".
 *
 * Test mode: with the Razorpay test key (rzp_test_*) you can use the
 * standard test card 4111 1111 1111 1111 to simulate a payment without
 * real money moving. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in env
 * when you're ready.
 */

import * as crypto from "crypto";

const RAZORPAY_API = "https://api.razorpay.com/v1";

export interface RazorpayOrderOptions {
  /** Plan id — currently only "premium" is paid. */
  planId: string;
  /** Amount in paise (Razorpay's smallest unit, ₹1 = 100 paise). */
  amountPaise: number;
  /** ISO currency code. INR only for now. */
  currency: string;
  /** Unique reference we can match in the webhook. */
  receipt: string;
  /** Free-form notes that show up in the Razorpay dashboard. */
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
  configured: boolean;
}

export function getRazorpayCredentials(): RazorpayCredentials {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const configured =
    !!keyId &&
    !!keySecret &&
    keyId.startsWith("rzp_") &&
    !keyId.includes("your-key");
  return { keyId, keySecret, configured };
}

/**
 * Create a Razorpay order. Throws if credentials are missing — the caller
 * (the /api/billing/razorpay/order route) is responsible for catching
 * and returning a clean 503 with an actionable message.
 */
export async function createRazorpayOrder(
  opts: RazorpayOrderOptions
): Promise<RazorpayOrder> {
  const { keyId, keySecret, configured } = getRazorpayCredentials();
  if (!configured) {
    throw new RazorpayNotConfiguredError(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment to enable payments."
    );
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: opts.currency,
      receipt: opts.receipt,
      notes: opts.notes ?? {},
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order creation failed (${res.status}): ${body}`);
  }

  return (await res.json()) as RazorpayOrder;
}

/**
 * Verify the HMAC signature Razorpay sends in the webhook payload. The
 * signature is `HMAC_SHA256(order_id|payment_id, key_secret)` hex-encoded.
 * This prevents attackers from forging a "payment successful" callback.
 *
 * Returns true if the signature is valid.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  // Use timingSafeEqual so we don't leak length info via timing.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export class RazorpayNotConfiguredError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "RazorpayNotConfiguredError";
  }
}
