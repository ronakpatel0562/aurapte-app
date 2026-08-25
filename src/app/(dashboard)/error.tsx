"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, AlertTriangle, ArrowLeft } from "lucide-react";

export default function DashboardErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Dashboard caught runtime error:", error);

    // If session/auth error, redirect to login automatically
    if (
      error.message?.toLowerCase().includes("auth") ||
      error.message?.toLowerCase().includes("session") ||
      error.message?.toLowerCase().includes("unauthorized")
    ) {
      router.replace("/login");
    }
  }, [error, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-14 h-14 rounded-full bg-error-soft border border-hairline flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-error" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-ink">Dashboard temporarily unavailable</h2>
        <p className="text-sm text-mute leading-relaxed">
          We encountered an issue loading this section. You can retry loading or return to the dashboard.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            reset();
            window.location.reload();
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-sm hover:opacity-95 active:scale-[0.99] transition cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          Reload Page
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft-2 text-ink font-semibold text-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
