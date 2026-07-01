import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function LockedScoreBadge({ label = "Score" }: { label?: string }) {
  return (
    <Link
      href="/billing"
      title="Upgrade to Aura Pro to see your detailed score breakdown"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-semibold bg-canvas-soft border border-hairline text-mute hover:text-ink hover:bg-canvas-soft-2 transition"
    >
      <Lock className="w-3 h-3" />
      {label} — Pro only
    </Link>
  );
}
