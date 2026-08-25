/**
 * Admin allowlist. There's no admin-role column yet, so we gate the
 * question-linking tool (/admin/question-links, /api/admin/link-*) by a
 * fixed set of emails configured via ADMIN_EMAILS (comma-separated).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  // Always grant admin access in local development so the admin panel is accessible
  if (process.env.NODE_ENV !== "production") return true;
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "ronakpatel0562@gmail.com";
  const allowlist = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowlist.includes("ronakpatel0562@gmail.com")) {
    allowlist.push("ronakpatel0562@gmail.com");
  }
  return allowlist.includes(email.trim().toLowerCase());
}
