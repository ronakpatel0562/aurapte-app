"use client";

import React, { useEffect, useRef, useState } from "react";
import { Lock, Sparkles, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * RazorpayCheckout — drops the Razorpay widget script once on mount,
 * then opens the checkout modal when the user clicks the CTA. Handles
 * the three states the user will see:
 *
 *   1. Razorpay not configured (no key in env) — show a friendly notice
 *      explaining how to set the env vars.
 *   2. Configured — show the "Upgrade" CTA.
 *   3. After successful payment — show a thank-you and reload so the
 *      header/sidebar reflect the new plan.
 *
 * The component is self-contained: pass in the planId and it does the
 * rest. No prop-drilling of credentials — those stay server-side.
 */
declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface Props {
  planId: PlanId;
  /** True if Razorpay env vars are set. Server-side derived. */
  configured: boolean;
  /** Optional redirect target after success — usually "/dashboard". */
  successPath?: string;
  /** Force a specific button label, e.g. "Upgrade to Pro". */
  label?: string;
}

export default function RazorpayCheckout({ planId, configured, successPath = "/dashboard", label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const plan = PLANS[planId];
  const isPaid = plan.isPaid && plan.priceInr > 0;

  // Inject the Razorpay checkout.js once. Official CDN, no bundling needed.
  useEffect(() => {
    if (!configured || !isPaid) return;
    if (scriptLoadedRef.current) return;
    if (window.Razorpay) {
      scriptLoadedRef.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
    };
    script.onerror = () => {
      setError("Failed to load Razorpay checkout. Check your network connection.");
    };
    document.head.appendChild(script);
  }, [configured, isPaid]);

  async function handleClick() {
    if (!configured) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? `Order failed (HTTP ${res.status})`);
        setLoading(false);
        return;
      }

      if (!window.Razorpay) {
        setError("Razorpay script not loaded yet. Try again in a moment.");
        setLoading(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "AuraPTE",
        description: `${plan.name} subscription`,
        order_id: data.orderId,
        handler: () => {
          // The webhook flips the plan server-side. Reload to reflect it.
          window.location.href = successPath;
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: {
          color: "#171717",
          backdrop_color: "rgba(0,0,0,0.6)",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setError(response?.error?.description ?? "Payment failed. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error opening checkout.");
      setLoading(false);
    }
  }

  if (!isPaid) return null;

  if (!configured) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="w-full h-12 rounded-lg bg-canvas-soft-2 border border-hairline text-ink font-semibold flex items-center justify-center gap-2 cursor-not-allowed opacity-70"
        >
          <Lock className="w-4 h-4" />
          {label ?? `Upgrade to ${plan.name}`}
        </button>
        <div className="flex items-start gap-2 p-3 bg-warning-soft/40 border border-warning/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-warning-deep shrink-0 mt-0.5" />
          <div className="text-xs text-warning-deep leading-relaxed">
            <strong>Payment not configured.</strong> Set{" "}
            <code className="font-mono text-2xs">RAZORPAY_KEY_ID</code> and{" "}
            <code className="font-mono text-2xs">RAZORPAY_KEY_SECRET</code> in your environment
            to enable real payments. The plan upgrade flow will work as soon as the keys are set.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full h-12 rounded-lg bg-gradient-to-r from-gradient-preview-start to-gradient-preview-end text-white font-semibold hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opening checkout…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {label ?? `Upgrade to ${plan.name}`}
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-error-soft border border-error/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-error-deep shrink-0 mt-0.5" />
          <div className="text-xs text-error-deep leading-relaxed">{error}</div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 text-2xs text-mute">
        <ShieldCheck className="w-3 h-3" />
        Secure payment via Razorpay · UPI, cards, netbanking, wallets
      </div>
    </div>
  );
}
