/**
 * Admin allowlist. There's no admin-role column yet, so we gate the
 * question-linking tool (/admin/question-links, /api/admin/link-*) by a
 * fixed set of emails configured via ADMIN_EMAILS (comma-separated).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.trim().toLowerCase());
}
