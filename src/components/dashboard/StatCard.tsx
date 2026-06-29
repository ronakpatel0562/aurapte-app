"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  desc: string;
  /**
   * Rendered icon. Pass a rendered ReactNode (e.g. `<HelpCircle className="..." />`)
   * rather than the icon component itself — Server Components can't pass
   * functions (icon components are functions) across the RSC boundary into
   * Client Components.
   */
  icon: React.ReactNode;
  /** Optional micro-trend value (e.g. "+12% this week"). Rendered as a
   *  positive trend chip in the bottom-right corner. */
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ title, value, desc, icon, trend }: StatCardProps) {
  return (
    <div className="card-hover bg-canvas border border-hairline rounded-xl p-5 sm:p-6 shadow-vercel-card flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-mute uppercase tracking-wider">
          {title}
        </span>
        <div className="w-9 h-9 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
            {value}
          </div>
          <p className="text-2xs text-mute mt-1 leading-relaxed">{desc}</p>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-2xs font-mono font-semibold uppercase ${
              trend.positive
                ? "bg-success/10 text-success"
                : "bg-error-soft text-error-deep"
            }`}
          >
            <ArrowUpRight className={`w-3 h-3 ${trend.positive ? "" : "rotate-90"}`} />
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
