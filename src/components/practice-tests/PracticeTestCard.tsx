"use client";

import React from "react";
import Link from "next/link";
import { Mic, PenTool, BookOpenCheck, Headphones, Lock, ChevronRight, CheckCircle2 } from "lucide-react";
import { requestFullscreenOnNavigate } from "@/lib/fullscreen";

interface ModuleRow {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Icon-circle tint — saturated so each module reads at a glance. */
  iconTint: string;
}

const MODULES: ModuleRow[] = [
  { key: "speaking", label: "Speaking", icon: Mic, iconTint: "bg-error/10 text-error-deep" },
  { key: "writing", label: "Writing", icon: PenTool, iconTint: "bg-link/10 text-link-deep" },
  { key: "reading", label: "Reading", icon: BookOpenCheck, iconTint: "bg-warning/10 text-warning-deep" },
  { key: "listening", label: "Listening", icon: Headphones, iconTint: "bg-cyan/15 text-cyan-deep" },
];

interface PracticeTestCardProps {
  id: string;
  testNumber: number;
  isLocked: boolean;
  /** Module keys the user has at least one recorded attempt for on this test. */
  attemptedModules?: string[];
}

export default function PracticeTestCard({ id, testNumber, isLocked, attemptedModules = [] }: PracticeTestCardProps) {
  const attemptedSet = new Set(attemptedModules);
  const attemptedCount = MODULES.filter((m) => attemptedSet.has(m.key)).length;

  return (
    <div
      className={`card-hover ${isLocked ? "card-locked" : ""} group bg-canvas border border-hairline rounded-xl overflow-hidden flex flex-col`}
    >
      <div className="p-5 space-y-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border shrink-0 transition duration-200 ${
                isLocked
                  ? "bg-canvas-soft-2 text-mute border-hairline"
                  : "bg-canvas text-ink border-hairline-strong group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary shadow-sm"
              }`}
            >
              {testNumber < 10 ? `0${testNumber}` : testNumber}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-sm font-semibold text-ink truncate">Practice Test {testNumber}</h3>
              <span className="text-[10px] text-mute font-mono uppercase tracking-wider block">4 Modules</span>
            </div>
          </div>

          {isLocked && (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-warning-deep bg-warning-soft border border-warning-deep/15 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shrink-0">
              <Lock className="w-2.5 h-2.5" />
              <span>Premium</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const attempted = !isLocked && attemptedSet.has(m.key);
            return (
              <Link
                key={m.key}
                href={isLocked ? "/billing" : `/practice-tests/${id}?module=${m.key}`}
                onClick={isLocked ? undefined : requestFullscreenOnNavigate}
                className="flex items-center gap-2.5 rounded-lg border border-hairline bg-canvas-soft/40 px-2.5 py-2 transition hover:bg-canvas-soft hover:border-hairline-strong"
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isLocked ? "bg-canvas-soft-2 text-mute" : m.iconTint
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xs font-semibold text-ink truncate">{m.label}</span>
                  <span
                    className={`flex items-center gap-1 text-[9px] font-mono uppercase tracking-wide truncate ${
                      attempted ? "text-success" : "text-mute"
                    }`}
                  >
                    {attempted && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                    {isLocked ? "Locked" : attempted ? "Attempted" : "Not Attempted"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-hairline bg-canvas-soft/50">
        {isLocked ? (
          <Link
            href="/billing"
            className="text-xs font-semibold text-warning-deep hover:text-warning-deep/80 transition flex items-center justify-center gap-1 font-mono uppercase tracking-wider"
          >
            <span>Upgrade to unlock</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-mute uppercase tracking-wider">
              {attemptedCount} / {MODULES.length} Attempted
            </span>
            <div className="flex items-center gap-1">
              {MODULES.map((m) => (
                <span
                  key={m.key}
                  className={`w-1.5 h-1.5 rounded-full ${attemptedSet.has(m.key) ? "bg-success" : "bg-hairline-strong"}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
