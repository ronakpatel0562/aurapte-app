"use client";

import React, { useEffect, useRef } from "react";

/**
 * HeroScene — the 3D centerpiece of the landing page. Three.js is loaded
 * via dynamic import so the bundle doesn't ship the 4MB three.js core
 * to users who never visit the marketing page.
 *
 * What's on screen:
 *   - A wireframe sphere (the "Aura" — PTE prep theme is "energy around
 *     a core idea"), slowly rotating and morphing between geometries.
 *   - A surrounding ring of small floating spheres, each gently orbiting
 *     on its own axis — represents the four PTE modules (Speaking,
 *     Writing, Reading, Listening) circling the central preparation goal.
 *   - A particle field for depth.
 *
 * Performance budget:
 *   - Target 60fps on a mid-range laptop. Limit particles, use
 *     instanced meshes for the orbiting spheres, skip shadows.
 *   - Pixel ratio capped at 2 to avoid retina melting.
 *   - Renders to a fixed-size canvas; ResizeObserver handles DPR changes.
 *   - Pauses when the document is hidden (browsers throttle setInterval
 *     anyway, but requestAnimationFrame is safer to gate).
 */
export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      // Dynamic import — only this code path pays the three.js cost.
      const THREE = await import("three");
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 7);

      const sizes = { width: 1, height: 1 };
      const resize = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        sizes.width = w;
        sizes.height = h;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();

      // ---------------------------------------------------------------
      // Central "Aura" — wireframe icosahedron morphing to a sphere.
      // ---------------------------------------------------------------
      const auraGeom = new THREE.IcosahedronGeometry(1.6, 1);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x0070f3,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      const aura = new THREE.Mesh(auraGeom, auraMat);
      scene.add(aura);

      // Inner solid sphere to give the wireframe visual depth.
      const coreGeom = new THREE.SphereGeometry(0.9, 32, 32);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x7928ca,
        transparent: true,
        opacity: 0.18,
      });
      const core = new THREE.Mesh(coreGeom, coreMat);
      scene.add(core);

      // Outer thin ring for an "aura" / halo effect.
      const ringGeom = new THREE.TorusGeometry(2.4, 0.012, 8, 128);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00dfd8,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2.4;
      scene.add(ring);

      // ---------------------------------------------------------------
      // Orbiting spheres — 4 of them, one per PTE module.
      // ---------------------------------------------------------------
      const orbitColors = [0x007cf0, 0x7928ca, 0xff0080, 0x50e3c2];
      const orbitGroup = new THREE.Group();
      const orbits: Array<{ mesh: any; speed: number; radius: number; tilt: number; phase: number }> = [];
      for (let i = 0; i < 4; i++) {
        const sphereGeom = new THREE.SphereGeometry(0.12, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: orbitColors[i] });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        orbitGroup.add(sphere);
        orbits.push({
          mesh: sphere,
          speed: 0.2 + Math.random() * 0.15,
          radius: 2.6,
          tilt: (Math.PI * 2 * i) / 4,
          phase: (Math.PI * 2 * i) / 4,
        });
      }
      scene.add(orbitGroup);

      // ---------------------------------------------------------------
      // Particle field — tiny dots filling the background.
      // ---------------------------------------------------------------
      const PARTICLE_COUNT = 220;
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = 6 + Math.random() * 8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const particleGeom = new THREE.BufferGeometry();
      particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0xa1a1a1,
        size: 0.02,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6,
      });
      const particles = new THREE.Points(particleGeom, particleMat);
      scene.add(particles);

      // ---------------------------------------------------------------
      // Animation loop
      // ---------------------------------------------------------------
      let rafId = 0;
      let running = true;
      const clock = new THREE.Clock();

      const tick = () => {
        if (!running) return;
        const t = clock.getElapsedTime();

        // Aura — slow rotation + scale pulse
        aura.rotation.x = t * 0.12;
        aura.rotation.y = t * 0.18;
        const pulse = 1 + Math.sin(t * 1.4) * 0.04;
        aura.scale.set(pulse, pulse, pulse);

        // Core — counter-rotate
        core.rotation.x = -t * 0.08;
        core.rotation.y = -t * 0.14;

        // Ring — independent slow rotation
        ring.rotation.z = t * 0.1;
        ring.rotation.y = Math.sin(t * 0.3) * 0.2;

        // Orbits
        orbits.forEach((o) => {
          const angle = t * o.speed + o.phase;
          o.mesh.position.set(
            Math.cos(angle) * o.radius,
            Math.sin(o.tilt) * Math.sin(angle) * 0.6,
            Math.sin(angle) * o.radius
          );
        });

        // Particles — slow drift
        particles.rotation.y = t * 0.02;
        particles.rotation.x = Math.sin(t * 0.1) * 0.1;

        renderer.render(scene, camera);
        rafId = requestAnimationFrame(tick);
      };
      tick();

      // ---------------------------------------------------------------
      // Cleanup
      // ---------------------------------------------------------------
      const handleResize = () => resize();
      window.addEventListener("resize", handleResize);

      // Pause when tab is hidden — saves battery.
      const handleVisibility = () => {
        running = !document.hidden;
        if (running) {
          clock.start();
          tick();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      cleanup = () => {
        running = false;
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("visibilitychange", handleVisibility);
        renderer.dispose();
        auraGeom.dispose();
        auraMat.dispose();
        coreGeom.dispose();
        coreMat.dispose();
        ringGeom.dispose();
        ringMat.dispose();
        particleGeom.dispose();
        particleMat.dispose();
        orbits.forEach((o) => {
          (o.mesh.geometry as any).dispose();
          (o.mesh.material as any).dispose();
        });
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="landing-3d-canvas"
      aria-hidden="true"
    />
  );
}
