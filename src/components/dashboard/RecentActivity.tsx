"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Calendar, Award, BookOpenCheck } from "lucide-react";
import { getTaskTypeFriendlyName } from "@/lib/taskTypeMapper";

export type ActivityEntry =
  | {
      kind: "test";
      id: string;
      title: string;
      testKind: "mock" | "practice";
      scorePercent: number;
      date: string;
      href: string;
    }
  | {
      kind: "question";
      id: string;
      score: number;
      maxScore: number;
      isCorrect: boolean;
      date: string;
      module: string;
      taskType: string;
      title: string;
      href: string;
    };

interface RecentActivityProps {
  entries: ActivityEntry[];
}

/**
 * Recent Activity — a single unified feed mixing completed test sessions
 * (mock/practice, grouped by test_id) with standalone question attempts
 * (practice taken outside of a test). Kept as one list rather than two
 * separate "Recent Tests" / "Recent Activity" sections since both answer
 * the same question ("what did I just do?") and a completed test already
 * accounts for its own questions — listing them again separately would be
 * duplicate information.
 */
export default function RecentActivity({ entries }: RecentActivityProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="bg-canvas border border-hairline rounded-xl shadow-vercel-card py-12 px-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-canvas-soft-2 border border-hairline flex items-center justify-center mb-3">
          <Circle className="w-5 h-5 text-mute" />
        </div>
        <p className="text-body-sm font-medium text-ink">No activity yet</p>
        <p className="text-2xs text-mute mt-1">
          Pick a module or test above to get started — your activity will show up here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: horizontal scroll cards */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-3 pb-2">
        {entries.map((e) => (
          <ActivityCard key={`${e.kind}-${e.id}`} entry={e} />
        ))}
      </div>

      {/* Tablet / desktop: vertical table */}
      <div className="hidden md:block bg-canvas border border-hairline rounded-xl shadow-vercel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas-soft border-b border-hairline text-2xs font-semibold text-mute uppercase font-mono tracking-wider">
                <th className="py-3 px-6">Activity</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Result</th>
                <th className="py-3 px-6">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {entries.map((e) => (
                <ActivityRow key={`${e.kind}-${e.id}`} entry={e} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Strips the trailing difficulty-rank marker (e.g. "Title #20") that's baked into stored question titles. */
function displayTitle(title: string): string {
  return title.replace(/\s*#\d+\s*$/, "");
}

function typeLabel(e: ActivityEntry): string {
  if (e.kind === "test") return e.testKind === "mock" ? "Mock Test" : "Practice Test";
  return `${e.module} · ${getTaskTypeFriendlyName(e.taskType)}`;
}

function resultBadge(e: ActivityEntry): { passed: boolean; text: string } {
  if (e.kind === "test") return { passed: e.scorePercent >= 60, text: `${e.scorePercent}%` };
  return { passed: e.isCorrect, text: `${e.score} / ${e.maxScore}` };
}

function ActivityCard({ entry: e }: { entry: ActivityEntry }) {
  const { passed, text } = resultBadge(e);
  return (
    <Link
      href={e.href}
      className="card-hover min-w-[260px] max-w-[260px] snap-start bg-canvas border border-hairline rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold text-ink line-clamp-2">{displayTitle(e.title)}</div>
        {e.kind === "test" ? (
          e.testKind === "mock" ? (
            <Award className="w-4 h-4 text-mute shrink-0" />
          ) : (
            <BookOpenCheck className="w-4 h-4 text-mute shrink-0" />
          )
        ) : passed ? (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-mute shrink-0" />
        )}
      </div>
      <div className="text-2xs text-mute capitalize">{typeLabel(e)}</div>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-hairline">
        <span
          className={`text-2xs font-mono font-semibold uppercase px-2 py-0.5 rounded ${
            passed
              ? "bg-success/10 text-success border border-success/20"
              : "bg-error-soft text-error-deep border border-error/20"
          }`}
        >
          {e.kind === "test" ? "Completed" : passed ? "Passed" : "Attempted"}
        </span>
        <span className="text-2xs font-mono text-mute">{text}</span>
      </div>
    </Link>
  );
}

function ActivityRow({ entry: e }: { entry: ActivityEntry }) {
  const { passed, text } = resultBadge(e);
  return (
    <tr className="hover:bg-canvas-soft transition">
      <td className="py-4 px-6">
        <Link
          href={e.href}
          className="text-body-sm-strong font-medium text-ink hover:text-link hover:underline transition truncate max-w-[280px] block"
        >
          {displayTitle(e.title)}
        </Link>
      </td>
      <td className="py-4 px-6 text-xs text-body capitalize">{typeLabel(e)}</td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xs font-mono px-2 py-0.5 rounded font-semibold uppercase ${
              passed
                ? "bg-success/10 text-success border border-success/20"
                : "bg-error-soft text-error-deep border border-error/20"
            }`}
          >
            {e.kind === "test" ? "Completed" : passed ? "Passed" : "Attempted"}
          </span>
          <span className="text-xs font-mono text-mute">{text}</span>
        </div>
      </td>
      <td className="py-4 px-6 text-xs text-mute font-mono whitespace-nowrap">
        <Calendar className="w-3 h-3 inline mr-1.5 -mt-0.5" />
        {formatRelativeDate(e.date)}
      </td>
    </tr>
  );
}
