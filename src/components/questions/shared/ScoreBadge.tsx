import React from "react";
import LockedScoreBadge from "./LockedScoreBadge";

interface ScoreBadgeProps {
  score: number;
  maxScore: number;
  /** Detailed per-question scoring is an Aura Pro perk — Starter sees a locked badge instead. */
  locked?: boolean;
}

export default function ScoreBadge({ score, maxScore, locked = false }: ScoreBadgeProps) {
  if (locked) return <LockedScoreBadge />;

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  const getBadgeStyles = () => {
    if (percentage >= 80) {
      return "bg-success/10 text-success border border-success/20";
    } else if (percentage >= 50) {
      return "bg-warning-soft text-warning-deep border border-warning-deep/20";
    } else {
      return "bg-error-soft text-error-deep border border-error/20";
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-semibold ${getBadgeStyles()}`}>
      <span>Score:</span>
      <span>{score}</span>
      <span className="text-mute font-normal">/</span>
      <span>{maxScore}</span>
      {percentage >= 80 && <span className="ml-1 text-3xs font-semibold uppercase tracking-wider">Excellent</span>}
    </div>
  );
}
