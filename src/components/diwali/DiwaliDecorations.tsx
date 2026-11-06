"use client";

import React, { useEffect, useState } from "react";
import { isDiwaliActive } from "@/lib/diwali";
import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * Traditional Glowing Diya Component
 * Handcrafted vector with terracotta bowl, golden rim, and multi-layered flickering flame.
 */
export function GlowingDiya({
  className = "",
  size = 46,
}: {
  className?: string;
  size?: number;
}) {
  const scale = size / 48;
  return (
    <div
      className={`inline-flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        width={48 * scale}
        height={40 * scale}
        viewBox="0 0 48 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="diya-bowl-grad" x1="6" y1="22" x2="42" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D97706" />
            <stop stopColor="#92400E" />
            <stop stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="flame-outer" x1="24" y1="2" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF176" />
            <stop stopColor="#FF9800" />
            <stop stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="flame-inner" x1="24" y1="8" x2="24" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop stopColor="#FFF59D" />
            <stop stopColor="#FFB74D" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="diya-base-halo" cx="24" cy="30" r="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFB300" stopOpacity="0.35" />
            <stop stopColor="#B71C1C" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="24" cy="31" rx="20" ry="7" fill="url(#diya-base-halo)" />

        <g className="animate-diya-flame origin-bottom">
          <path
            d="M24 3 C27 9 32 15 30 21 C28 25 20 25 18 21 C16 15 21 9 24 3 Z"
            fill="url(#flame-outer)"
          />
          <path
            d="M24 8 C25.5 12 28 16 27 19.5 C26 22 22 22 21 19.5 C20 16 22.5 12 24 8 Z"
            fill="url(#flame-inner)"
          />
        </g>

        <line x1="24" y1="19" x2="24" y2="23" stroke="#261005" strokeWidth="1.8" strokeLinecap="round" />

        <path
          d="M6 23 C11 23 15 25 24 25 C33 25 37 23 42 23 C43 28 39 36 24 36 C9 36 5 28 6 23 Z"
          fill="url(#diya-bowl-grad)"
          stroke="#F59E0B"
          strokeWidth="1"
        />

        <path
          d="M7 23 Q24 26 41 23"
          stroke="#FDE68A"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <path
          d="M18 35 Q24 37 30 35"
          stroke="#D97706"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Hanging Festive Lantern (Kandil / Akashteerth)
 * Features an extended golden chain (72px) so that the entire faceted lantern body
 * and swaying tassels hang completely below the 64px navbar in full view.
 */
function HangingLantern({
  className = "",
  totalHeight = 230,
  chainHeight = 115,
  animationClass = "animate-lantern-sway-slow",
}: {
  className?: string;
  totalHeight?: number;
  chainHeight?: number;
  animationClass?: string;
}) {
  const bodyTop = chainHeight;
  const bodyHeight = 52;
  const bodyBottom = bodyTop + bodyHeight;
  const tasselBottom = bodyBottom + 52;

  return (
    <div
      className={`pointer-events-none select-none ${animationClass} ${className}`}
      aria-hidden="true"
    >
      <svg
        width="60"
        height={totalHeight}
        viewBox={`0 0 60 ${totalHeight}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`lantern-chain-${chainHeight}`} x1="30" y1="0" x2="30" y2={bodyTop} gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD54F" stopOpacity="0.9" />
            <stop stopColor="#FF9800" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id={`lantern-body-${chainHeight}`} x1="12" y1={bodyTop} x2="48" y2={bodyBottom} gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD54F" />
            <stop stopColor="#E65100" />
            <stop stopColor="#880E4F" />
          </linearGradient>
          <radialGradient id={`lantern-glow-${chainHeight}`} cx="30" cy={bodyTop + 26} r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF9C4" stopOpacity="0.95" />
            <stop stopColor="#FFB300" stopOpacity="0.65" />
            <stop stopColor="#FF6F00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Extended Chain / Thread dropping down past the 64px navbar */}
        <line
          x1="30"
          y1="0"
          x2="30"
          y2={bodyTop}
          stroke={`url(#lantern-chain-${chainHeight})`}
          strokeWidth="1.6"
          strokeDasharray="3 2"
        />
        <circle cx="30" cy={bodyTop} r="3" fill="#FFD54F" />

        {/* Ambient Lantern Glow */}
        <circle
          cx="30"
          cy={bodyTop + 26}
          r="28"
          fill={`url(#lantern-glow-${chainHeight})`}
          className="animate-lantern-glow"
        />

        {/* Geometric Lantern Body (Akashteerth / Kandil) fully visible below navbar */}
        <path
          d={`M30 ${bodyTop} L48 ${bodyTop + 26} L30 ${bodyBottom} L12 ${bodyTop + 26} Z`}
          fill={`url(#lantern-body-${chainHeight})`}
          stroke="#FFD54F"
          strokeWidth="1.6"
          className="drop-shadow-[0_0_14px_rgba(255,183,0,0.75)]"
        />

        {/* Inner Diamond Lattice */}
        <path
          d={`M30 ${bodyTop + 9} L40 ${bodyTop + 26} L30 ${bodyBottom - 9} L20 ${bodyTop + 26} Z`}
          fill="none"
          stroke="#FFF9C4"
          strokeWidth="1.2"
          strokeOpacity="0.95"
        />

        {/* Center Jewel Core */}
        <circle cx="30" cy={bodyTop + 26} r="4" fill="#FFF9C4" />

        {/* Bottom Tassel Ring */}
        <circle cx="30" cy={bodyBottom} r="3" fill="#FFC107" />

        {/* Swaying Golden Tassels with droplet beads */}
        <path d={`M27 ${bodyBottom + 2} L21 ${tasselBottom - 8}`} stroke="#FFD54F" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="21" cy={tasselBottom - 8} r="1.6" fill="#FFD54F" />

        <path d={`M30 ${bodyBottom + 2} L30 ${tasselBottom}`} stroke="#FFE082" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="30" cy={tasselBottom} r="2" fill="#FFE082" />

        <path d={`M33 ${bodyBottom + 2} L39 ${tasselBottom - 8}`} stroke="#FFD54F" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="39" cy={tasselBottom - 8} r="1.6" fill="#FFD54F" />
      </svg>
    </div>
  );
}

/**
 * Traditional Festive Toran (Bandhanwar)
 * A delicate top border festoon with marigolds and golden line.
 */
function FestiveToran() {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none select-none h-3 overflow-hidden opacity-90">
      <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(255,184,48,0.45)_0%,transparent_70%)]" />
      <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#FFD54F] to-transparent shadow-[0_0_8px_#FFA000]" />
    </div>
  );
}

/**
 * Main Festive Layer & Background
 * Embedded in root layout; automatically deactivates after the 7-day expiry.
 */
export default function DiwaliDecorations() {
  const [mounted, setMounted] = useState(false);
  const { isDiwaliActive, isDiwaliTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isDiwaliActive || !isDiwaliTheme) return null;

  return (
    <>
      {/* 1. Top-edge Festive Toran Gilded Line */}
      <FestiveToran />

      {/* 2. Micro-Stars & Golden Dust Constellation Layer */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 w-full h-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <g id="star-sparkle">
              <path
                d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z"
                fill="#FFD54F"
              />
            </g>
            <g id="star-micro">
              <circle cx="2" cy="2" r="1.5" fill="#FFE082" />
            </g>
          </defs>

          {/* Staggered micro stars with varied opacities */}
          <use href="#star-sparkle" x="6%" y="8%" className="animate-star-twinkle" style={{ animationDelay: "0.2s" }} opacity="0.45" />
          <use href="#star-micro" x="14%" y="15%" className="animate-star-twinkle" style={{ animationDelay: "1.1s" }} opacity="0.35" />
          <use href="#star-sparkle" x="24%" y="6%" className="animate-star-twinkle" style={{ animationDelay: "2.4s" }} opacity="0.5" />
          <use href="#star-micro" x="38%" y="12%" className="animate-star-twinkle" style={{ animationDelay: "0.8s" }} opacity="0.3" />
          <use href="#star-sparkle" x="52%" y="7%" className="animate-star-twinkle" style={{ animationDelay: "1.7s" }} opacity="0.55" />
          <use href="#star-micro" x="68%" y="14%" className="animate-star-twinkle" style={{ animationDelay: "2.9s" }} opacity="0.4" />
          <use href="#star-sparkle" x="82%" y="9%" className="animate-star-twinkle" style={{ animationDelay: "0.5s" }} opacity="0.45" />
          <use href="#star-micro" x="92%" y="16%" className="animate-star-twinkle" style={{ animationDelay: "1.9s" }} opacity="0.35" />

          {/* Lower delicate dust */}
          <use href="#star-micro" x="10%" y="35%" className="animate-star-twinkle" style={{ animationDelay: "1.4s" }} opacity="0.3" />
          <use href="#star-sparkle" x="30%" y="30%" className="animate-star-twinkle" style={{ animationDelay: "0.6s" }} opacity="0.4" />
          <use href="#star-micro" x="50%" y="38%" className="animate-star-twinkle" style={{ animationDelay: "2.1s" }} opacity="0.35" />
          <use href="#star-sparkle" x="78%" y="32%" className="animate-star-twinkle" style={{ animationDelay: "1.8s" }} opacity="0.45" />
          <use href="#star-micro" x="88%" y="40%" className="animate-star-twinkle" style={{ animationDelay: "0.3s" }} opacity="0.3" />
        </svg>

        {/* Ambient Warm Golden Auroral Glow in Header Region */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] rounded-full bg-[radial-gradient(circle,rgba(255,184,48,0.14)_0%,rgba(233,30,99,0.07)_50%,transparent_75%)] blur-3xl pointer-events-none"
        />
      </div>

      {/* 4. Hanging Lanterns — Responsive: elegant full-length on desktop, compact on mobile */}
      <div className="fixed top-0 left-0 right-0 z-20 pointer-events-none flex justify-between px-3 sm:px-12 md:pl-72 md:pr-14">
        {/* Left Lantern (Positioned at md:pl-72 on desktop so it clears the sidebar cleanly) */}
        <div className="hidden sm:flex items-start gap-5">
          <HangingLantern totalHeight={230} chainHeight={115} animationClass="animate-lantern-sway-slow" />
          <HangingLantern totalHeight={205} chainHeight={95} animationClass="animate-lantern-sway-fast" className="hidden lg:block opacity-85" />
        </div>

        {/* Right Lanterns — Full on tablet/desktop (sm:flex), compact & non-intrusive on mobile */}
        <div className="hidden sm:flex items-start gap-5">
          <HangingLantern totalHeight={205} chainHeight={95} animationClass="animate-lantern-sway-fast" className="hidden md:block opacity-85" />
          <HangingLantern totalHeight={230} chainHeight={115} animationClass="animate-lantern-sway-slow" />
        </div>

        {/* Mobile-only compact right lantern: subtle, shorter, non-intrusive */}
        <div className="sm:hidden flex items-start pr-1 opacity-70">
          <HangingLantern totalHeight={105} chainHeight={55} animationClass="animate-lantern-sway-slow" />
        </div>
      </div>
    </>
  );
}
