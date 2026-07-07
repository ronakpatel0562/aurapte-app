"use client";

import React, { useState } from "react";
import { Landmark, Copy, Check, Mail } from "lucide-react";
import type { PlanId } from "@/lib/plans";

/**
 * BankPaymentPanel — replaces the payment-gateway checkout button. Payment
 * is collected manually: the user reveals the account details, pays by bank
 * transfer/UPI, then emails proof so an admin can flip their plan by hand.
 * Placeholder account details below — fill in the real ones before launch.
 */
const BANK_DETAILS = {
  accountName: "[ACCOUNT HOLDER NAME]",
  accountNumber: "[ACCOUNT NUMBER]",
  ifsc: "[IFSC CODE]",
  bankName: "[BANK NAME]",
  upiId: "[UPI ID]",
};

const CONTACT_EMAIL = "payments@aurapte.com";

interface Props {
  planId: PlanId;
  planName: string;
  label?: string;
}

export default function BankPaymentPanel({ planId, planName, label }: Props) {
  const [open, setOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copy(field: string, value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  }

  const rows: [string, string][] = [
    ["Account name", BANK_DETAILS.accountName],
    ["Account number", BANK_DETAILS.accountNumber],
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

      <div className="flex items-start gap-2 p-3 bg-canvas-soft-2 border border-hairline rounded-lg text-xs text-mute leading-relaxed">
        <Mail className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          After paying, email your payment screenshot/reference to{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Payment for ${encodeURIComponent(planName)}`} className="text-link hover:underline">
            {CONTACT_EMAIL}
          </a>{" "}
          with the plan you paid for. We&apos;ll activate {planName} on your account within 24 hours.
        </span>
      </div>
    </div>
  );
}
