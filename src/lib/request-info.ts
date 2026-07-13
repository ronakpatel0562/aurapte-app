import { headers } from "next/headers";

/**
 * IP + user-agent for the current request, read from headers set by the
 * platform proxy (Vercel sets x-forwarded-for / x-real-ip). Used to log
 * device/session history at login — see session_history table.
 */
export function getClientInfo(): { ip: string | null; userAgent: string | null } {
  const h = headers();
  const forwardedFor = h.get("x-forwarded-for");
  const ip = (forwardedFor ? forwardedFor.split(",")[0].trim() : h.get("x-real-ip")) || null;
  const userAgent = h.get("user-agent");
  return { ip, userAgent: userAgent || null };
}
