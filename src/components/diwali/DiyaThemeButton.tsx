"use client";

import React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { GlowingDiya } from "./DiwaliDecorations";

export default function DiyaThemeButton({ className = "" }: { className?: string }) {
  const { isDiwaliActive, isDiwaliTheme, toggleDiwaliTheme } = useTheme();

  if (!isDiwaliActive) return null;

  return (
    <button
      type="button"
      onClick={toggleDiwaliTheme}
      title={
        isDiwaliTheme
          ? "Diwali Theme Active — Click to switch to standard Light/Dark mode"
          : "Celebrate Diwali — Click to switch to Diwali Festive Theme 🪔"
      }
      aria-label={
        isDiwaliTheme
          ? "Switch to standard Light/Dark theme"
          : "Switch to Diwali festive theme"
      }
      className={`relative inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer select-none ${
        isDiwaliTheme
          ? "border-amber-400/60 bg-[#2d0a16]/90 text-[#ffd54f] shadow-[0_0_15px_rgba(255,184,48,0.35)] hover:border-amber-300 hover:shadow-[0_0_20px_rgba(255,184,48,0.55)]"
          : "border-hairline bg-canvas-soft text-mute hover:text-amber-400 hover:border-amber-400/50 hover:bg-canvas-soft-2"
      } ${className}`}
    >
      <GlowingDiya size={20} />
      <span className="text-2xs sm:text-xs font-semibold">
        {isDiwaliTheme ? "Diwali" : "Diwali 🪔"}
      </span>
      {isDiwaliTheme && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping ml-0.5" />
      )}
    </button>
  );
}

