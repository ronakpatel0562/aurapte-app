import React from "react";

/**
 * Lightweight skeleton block. Pure CSS animation, no JS, no layout shift.
 * Use to fill the main area while server data is being fetched so the
 * user has visible feedback the click was registered.
 */

export function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;
  return (
    <div
      className={`relative overflow-hidden bg-canvas-soft-2 border border-hairline rounded ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-canvas-soft to-transparent" />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

/** Question-loading skeleton: matches the shape of a question card. */
export function QuestionLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Audio player block */}
      <Skeleton className="h-32 w-full rounded-lg" />

      {/* Stem / instructions */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 space-y-4 shadow-vercel-card">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <Skeleton width={200} height={14} />
          <Skeleton width={80} height={20} />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-9/12" />
      </div>

      {/* Answer options */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 space-y-3 shadow-vercel-card">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/** Dashboard loading skeleton: stat cards + module grid + recent activity. */
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-10 py-2" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton width={280} height={32} />
        <Skeleton width={420} height={14} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-canvas border border-hairline p-6 rounded-lg shadow-vercel-card"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton width={120} height={12} />
              <Skeleton width={20} height={20} className="rounded-full" />
            </div>
            <Skeleton width={80} height={28} />
            <div className="mt-2">
              <Skeleton width={140} height={10} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

/** Module landing page skeleton: header + grid of task cards. */
export function ModuleLoadingSkeleton() {
  return (
    <div className="space-y-10 py-4" aria-busy="true" aria-live="polite">
      <div className="bg-canvas border border-hairline rounded-xl p-8 shadow-vercel-card">
        <div className="flex justify-between items-center gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <Skeleton width={40} height={40} className="rounded-lg" />
              <Skeleton width={260} height={28} />
            </div>
            <Skeleton width={420} height={12} />
          </div>
          <Skeleton width={150} height={60} className="rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** Question list skeleton: grid of question cards. */
export function QuestionListLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-vercel-card">
        <Skeleton width={200} height={14} />
        <div className="mt-2">
          <Skeleton width={520} height={12} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}