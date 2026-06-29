"use client";

import dynamic from "next/dynamic";

/**
 * HeroScene wrapper — defers loading of the (heavy) Three.js bundle to
 * the client only. Avoids SSR for a component that needs `window`,
 * `requestAnimationFrame`, and `WebGLRenderer`.
 */
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

export default HeroScene;
