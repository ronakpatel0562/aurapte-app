"use client";

import { useEffect } from "react";

/**
 * Blocks the right-click context menu site-wide — matches the real PTE
 * test driver, which disables it to discourage inspecting/copying exam
 * content. Left-click is untouched so every button/link keeps working.
 */
export default function DisableContextMenu() {
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  return null;
}
