"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Blocks the right-click context menu and devtools/view-source/save
 * keyboard shortcuts in production — matches the real PTE test driver,
 * which disables them to discourage inspecting/copying exam content.
 * Left-click and typing are untouched so every button/link/input keeps
 * working. Disabled entirely outside production so local development
 * (right-click → Inspect, view-source, etc.) is never blocked.
 */
const BLOCKED_KEY_COMBOS = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  if (key === "f12") return true;
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key)) return true;
  if ((e.ctrlKey || e.metaKey) && ["u", "s", "p"].includes(key)) return true;
  return false;
};

export default function DisableContextMenu() {
  const [warning, setWarning] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const showWarning = (message: string) => {
      setWarning(message);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setWarning(null), 2500);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showWarning("Right-click is disabled during your session.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (BLOCKED_KEY_COMBOS(e)) {
        e.preventDefault();
        showWarning("Keyboard shortcuts are not allowed during your session.");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!warning) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-lg bg-zinc-950 text-white text-sm font-medium shadow-vercel-card border border-zinc-800 transition-opacity duration-200">
      {warning}
    </div>
  );
}
