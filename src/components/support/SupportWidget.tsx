"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LifeBuoy, Mail, X } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappLink, mailtoLink } from "@/lib/contact";

/**
 * Global "need help?" launcher — rendered once in the root layout so every
 * page (marketing, auth, and the gated dashboard) offers the same two ways
 * to reach support, whether or not the visitor has bought a plan yet.
 */
export default function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed z-50 bottom-20 right-4 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 w-72 bg-canvas border border-hairline rounded-xl shadow-vercel-popover p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Need help?</p>
              <p className="text-2xs text-mute">We reply to every message — purchased or not.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support menu"
              className="w-7 h-7 rounded-md flex items-center justify-center text-mute hover:text-ink hover:bg-canvas-soft-2 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <a
            href={whatsappLink("Hi AuraPTE team, I have a question about")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2.5 rounded-lg border border-hairline hover:bg-canvas-soft-2 transition"
          >
            <span className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-ink">Chat on WhatsApp</span>
              <span className="block text-2xs text-mute truncate">{SUPPORT_WHATSAPP_DISPLAY} · WhatsApp only, not for calls</span>
            </span>
          </a>

          <a
            href={mailtoLink("Support request")}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-hairline hover:bg-canvas-soft-2 transition"
          >
            <span className="w-8 h-8 rounded-full bg-canvas-soft-2 text-ink flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-ink">Email us</span>
              <span className="block text-2xs text-mute truncate">{SUPPORT_EMAIL}</span>
            </span>
          </a>

          <Link
            href="/contact-us"
            onClick={() => setOpen(false)}
            className="block text-center text-2xs font-medium text-link hover:underline pt-1"
          >
            Or send a message from the contact page →
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support menu" : "Open support menu"}
        aria-expanded={open}
        className="w-[3.25rem] h-[3.25rem] rounded-full bg-primary text-on-primary shadow-vercel-popover flex items-center justify-center hover:bg-opacity-90 active:scale-[0.97] transition"
      >
        {open ? <X className="w-5 h-5" /> : <LifeBuoy className="w-5 h-5" />}
      </button>
    </div>
  );
}
