/**
 * Diwali Festive Theme Configuration & System Time Expiry Architecture
 *
 * Current activation date: 2026-11-06T19:40:09+05:30
 * Expiration date: Exactly 7 days later -> 2026-11-13T19:40:09+05:30
 * Unix timestamp (ms): 1794579009000
 *
 * Once Date.now() > DIWALI_EXPIRY_TIMESTAMP_MS, the entire site automatically
 * bypasses the Diwali theme, hides all festive decorations and popups,
 * and seamlessly restores the original Light/Dark themes and toggle controls
 * without requiring any manual redeployment.
 */

export const DIWALI_EXPIRY_ISO = "2026-11-13T19:40:09+05:30";
export const DIWALI_EXPIRY_TIMESTAMP_MS = 1794579009000;

export const DIWALI_STORAGE_KEYS = {
  THEME_ENABLED: "aurapte-diwali-theme-enabled",
  LOGIN_TRIGGER: "aurapte_diwali_login_trigger",
  MODAL_SHOWN: "aurapte_diwali_modal_shown",
} as const;

/**
 * Returns true if the current time is within the 7-day Diwali celebration window.
 */
export function isDiwaliActive(): boolean {
  return Date.now() <= DIWALI_EXPIRY_TIMESTAMP_MS;
}

/**
 * Checks if the user has explicitly enabled/disabled the Diwali theme during the active window.
 * Default is true (festive theme boots by default during the 7 days).
 */
export function isDiwaliThemeEnabled(): boolean {
  if (!isDiwaliActive()) return false;
  if (typeof window === "undefined") return true;
  try {
    const pref = localStorage.getItem(DIWALI_STORAGE_KEYS.THEME_ENABLED);
    return pref !== "false";
  } catch (_) {
    return true;
  }
}
