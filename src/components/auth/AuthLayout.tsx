"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, BarChart3, Laptop, ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-canvas-soft font-geist w-full">
      {/* Left Column: Brand Pitch (Visible on lg/desktop) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-zinc-950 text-white flex-col justify-between p-12 overflow-hidden border-r border-zinc-900">
        {/* Animated Mesh Glowing Backdrops */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-15%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-gradient-develop-start to-gradient-develop-end opacity-25 blur-[120px] animate-pulse" style={{ animationDuration: "12s" }} />
          <div className="absolute bottom-[-15%] right-[-10%] w-[90%] h-[90%] rounded-full bg-gradient-to-br from-gradient-preview-start to-gradient-preview-end opacity-20 blur-[130px] animate-pulse" style={{ animationDuration: "16s" }} />
        </div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

        {/* Top Section: Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.15)] transition group-hover:scale-105">
              {/* Inner glowing aura */}
              <div className="absolute inset-0 bg-gradient-to-tr from-gradient-develop-start to-gradient-preview-end opacity-50 blur-[2px]" />
              <div className="relative z-10 w-4 h-4 rounded-full bg-white shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Aura<span className="bg-gradient-to-r from-gradient-develop-start to-gradient-preview-end bg-clip-text text-transparent font-extrabold">PTE</span>
            </span>
          </Link>
        </div>

        {/* Middle Section: Features Presentation */}
        <div className="relative z-10 my-auto py-8">
          <div className="space-y-2 mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-gradient-develop-end animate-spin" style={{ animationDuration: "6s" }} />
              <span>Version 2.0 Released</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight leading-tight text-white max-w-sm">
              Experience the future of PTE preparation
            </h2>
            <p className="text-sm text-zinc-400 max-w-sm">
              Our AI-powered engine analyzes your speaking, writing, reading, and listening responses against official test rubrics.
            </p>
          </div>

          <div className="space-y-6 max-w-md">
            {/* Feature 1 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-colors group-hover:bg-white/10 group-hover:border-white/20">
                <Sparkles className="w-5 h-5 text-gradient-develop-start" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">Instant AI Grading</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Speaking and Writing tasks scored in seconds with detailed metrics on pronunciation, fluency, and grammar.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-colors group-hover:bg-white/10 group-hover:border-white/20">
                <Laptop className="w-5 h-5 text-[#a855f7]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">Exact Exam Simulation</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Get comfortable with the test interface using modules designed to mirror Pearson Academic formatting.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-colors group-hover:bg-white/10 group-hover:border-white/20">
                <BarChart3 className="w-5 h-5 text-[#f43f5e]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">Smart Actionable Analytics</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Track scoring progress dynamically. Pinpoint weak questions and focus on high-impact improvement.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-colors group-hover:bg-white/10 group-hover:border-white/20">
                <ShieldCheck className="w-5 h-5 text-gradient-develop-end" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">Single Session Validation</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Enjoy secure progress tracking with single active session protection and robust local state storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Footer */}
        <div className="relative z-10 flex justify-between items-center text-xs text-zinc-500 border-t border-white/5 pt-6">
          <span>© {new Date().getFullYear()} AuraPTE.com</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right Column: Auth Container (Full viewport on mobile, col-span-7 on desktop) */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center min-h-screen px-4 sm:px-8 py-12 relative overflow-hidden bg-zinc-50">
        {/* Soft background light blooms for light mode */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-gradient-develop-start to-gradient-develop-end opacity-10 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-gradient-preview-start to-gradient-preview-end opacity-10 blur-[100px]" />
        </div>

        {/* Small top logo for mobile viewports */}
        <div className="lg:hidden mb-8 z-10 flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800 overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-gradient-develop-start to-gradient-preview-end opacity-40 blur-[1px]" />
            <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-white shadow-inner flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-zinc-950" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Aura<span className="bg-gradient-to-r from-gradient-develop-start to-gradient-preview-end bg-clip-text text-transparent font-extrabold">PTE</span>
          </span>
        </div>

        <div className="relative z-10 w-full flex justify-center max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
