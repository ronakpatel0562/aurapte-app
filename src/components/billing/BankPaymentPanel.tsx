"use client";

import React, { useState } from "react";
import { Landmark, Copy, Check, Mail, Upload, Loader2, CheckCircle2 } from "lucide-react";
import type { PlanId } from "@/lib/plans";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink } from "@/lib/contact";

/**
 * BankPaymentPanel — replaces the payment-gateway checkout button. Payment
 * is collected manually: the user reveals the account details, pays by bank
 * transfer/UPI, then submits proof in-app (reference + optional screenshot)
 * via /api/billing/claims so an admin can approve it at /admin/payments
 * without the user ever having to open a mail app.
 */
const BANK_DETAILS = {
  accountNumber: "5345413232",
  accountName: "BADRESHIYA AKSHAYKUMAR GHANSHYAMBHAI",
  ifsc: "KKBK0000822",
  bankName: "KOTAK 811 FULL KYC",
  upiId: "8320821028@kotak",
};

const CONTACT_EMAIL = SUPPORT_EMAIL;

interface Props {
  planId: PlanId;
  planName: string;
  label?: string;
}

type SubmitState = "idle" | "submitting" | "submitted" | "error";

export default function BankPaymentPanel({ planId, planName, label }: Props) {
  const [open, setOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reference, setReference] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  function copy(field: string, value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reference.trim().length < 3) {
      setSubmitError("Enter the payment reference / UTR number");
      return;
    }
    setSubmitState("submitting");
    setSubmitError(null);

    const form = new FormData();
    form.set("planId", planId);
    form.set("reference", reference.trim());
    if (screenshot) form.set("screenshot", screenshot);

    try {
      const res = await fetch("/api/billing/claims", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong, please try again");
        setSubmitState("error");
        return;
      }
      setSubmitState("submitted");
    } catch {
      setSubmitError("Network error, please try again");
      setSubmitState("error");
    }
  }

  const rows: [string, string][] = [
    ["Account number", BANK_DETAILS.accountNumber],
    ["Account name", BANK_DETAILS.accountName],
    ["IFSC", BANK_DETAILS.ifsc],
    ["Bank", BANK_DETAILS.bankName],
    ["UPI ID", BANK_DETAILS.upiId],
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-lg bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end text-white font-semibold hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
      >
        <Landmark className="w-4 h-4" />
        {label ?? `Get payment details for ${planName}`}
      </button>
    );
  }

  if (submitState === "submitted") {
    return (
      <div className="flex items-start gap-2.5 p-4 bg-success/10 border border-success/20 rounded-lg text-sm text-success">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Submitted — we&apos;ll review your payment and activate {planName} on your account within
          24 hours.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-hairline bg-canvas-soft-2 p-4 space-y-2.5">
        {rows.map(([field, value]) => (
          <div key={field} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-mute">{field}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-ink">{value}</span>
              <button
                onClick={() => copy(field, value)}
                className="text-mute hover:text-ink transition"
                aria-label={`Copy ${field}`}
              >
                {copiedField === field ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-11 rounded-lg bg-ink text-canvas text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          I&apos;ve made the payment
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5 rounded-lg border border-hairline p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-mute">
              Payment reference / UTR number
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. 302819475102"
              className="w-full h-9 px-3 text-sm bg-canvas border border-hairline rounded-md outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-mute">Screenshot (optional)</label>
            <label className="flex items-center gap-2 h-9 px-3 text-sm text-mute bg-canvas border border-dashed border-hairline rounded-md cursor-pointer hover:text-ink transition">
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{screenshot ? screenshot.name : "Attach a screenshot"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {submitError && <p className="text-xs text-error">{submitError}</p>}

          <button
            type="submit"
            disabled={submitState === "submitting"}
            className="w-full h-10 rounded-lg bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end text-white text-sm font-semibold hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitState === "submitting" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Submit payment proof"
            )}
          </button>
        </form>
      )}

      <div className="flex items-start gap-2 p-3 bg-canvas-soft-2 border border-hairline rounded-lg text-xs text-mute leading-relaxed">
        <Mail className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Prefer email? Send your payment screenshot/reference to{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Payment for ${encodeURIComponent(planName)}`} className="text-link hover:underline">
            {CONTACT_EMAIL}
          </a>{" "}
          instead.
        </span>
      </div>

      <div className="flex items-start gap-2 p-3 bg-canvas-soft-2 border border-hairline rounded-lg text-xs text-mute leading-relaxed">
        <WhatsAppIcon className="w-4 h-4 shrink-0 mt-0.5 text-[#25D366]" />
        <span>
          Stuck, or just want to double-check before paying? Message us on WhatsApp at{" "}
          <a
            href={whatsappLink(`Hi, I have a question about payment for the ${planName} plan.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:underline"
          >
            {SUPPORT_WHATSAPP_DISPLAY}
          </a>{" "}
          (WhatsApp only, not for calls) — you don&apos;t need to have paid yet to ask.
        </span>
      </div>
    </div>
  );
}
