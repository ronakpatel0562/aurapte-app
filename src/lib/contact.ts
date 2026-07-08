/**
 * Single source of truth for support contact details. Referenced by the
 * contact page, the global support widget, the footer, and anywhere else
 * that offers a way to reach the team — change the number/email once here.
 */

export const SUPPORT_EMAIL = "support.aurapte@gmail.com";

/** Digits only, with country code, no "+" — the format wa.me expects. */
export const SUPPORT_WHATSAPP_DIGITS = "919409956679";

export const SUPPORT_WHATSAPP_DISPLAY = "+91 94099 56679";

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SUPPORT_WHATSAPP_DIGITS}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function mailtoLink(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${SUPPORT_EMAIL}${qs ? `?${qs}` : ""}`;
}
