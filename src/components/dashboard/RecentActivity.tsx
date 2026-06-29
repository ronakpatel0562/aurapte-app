"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Calendar } from "lucide-react";
import { mapDbToUrlTaskType, getTaskTypeFriendlyName } from "@/lib/taskTypeMapper";

interface Attempt {
  id: string;
  score: number;
  max_score: number;
  is_correct: boolean;
  attempted_at: string;
  question_id: string;
  questions?: {
    id: string;
    module: string;
    task_type: string;
    title?: string;
  } | null;
}

interface RecentActivityProps {
  attempts: Attempt[];
}

/**
 * Recent activity — small horizontal list of the most recent attempts.
 * Each row shows: question title (link), module + task type label,
 * pass/attempt status with score, and relative date. The list scrolls
 * horizontally on phones (cards) and falls back to a vertical list
 * with the same data on wider viewports.
 *
 * Pure display component: data is fetched server-side and passed in.
 */
export default function RecentActivity({ attempts }: RecentActivityProps) {
  if (!attempts || attempts.length === 0) {
    return (
      <div className="bg-canvas border border-hairline rounded-xl shadow-vercel-card py-12 px-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-canvas-soft-2 border border-hairline flex items-center justify-center mb-3">
          <Circle className="w-5 h-5 text-mute" />
        </div>
        <p className="text-body-sm font-medium text-ink">No attempts yet</p>
        <p className="text-2xs text-mute mt-1">
          Pick a module above to start practising — your activity will show up here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: horizontal scroll cards */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-3 pb-2">
        {attempts.slice(0, 10).map((a) => (
          <AttemptCard key={a.id} attempt={a} />
        ))}
      </div>

      {/* Tablet / desktop: vertical table */}
      <div className="hidden md:block bg-canvas border border-hairline rounded-xl shadow-vercel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas-soft border-b border-hairline text-2xs font-semibold text-mute uppercase font-mono tracking-wider">
                <th className="py-3 px-6">Question</th>
                <th className="py-3 px-6">Module / Task</th>
                <th className="py-3 px-6">Result</th>
                <th className="py-3 px-6">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {attempts.slice(0, 10).map((a) => (
                <AttemptRow key={a.id} attempt={a} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function formatRelativeDate(iso: string): string {
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

function AttemptCard({ attempt: a }: { attempt: Attempt }) {
  const q = a.questions;
  if (!q) return null;
  const passed = a.is_correct;
  return (
    <Link
      href={`/questions/${q.module}/${mapDbToUrlTaskType(q.task_type)}/${q.id}`}
      className="card-hover min-w-[260px] max-w-[260px] snap-start bg-canvas border border-hairline rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold text-ink line-clamp-2">{q.title || "Untitled"}</div>
        {passed ? (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-mute shrink-0" />
        )}
      </div>
      <div className="text-2xs text-mute">
        <span className="capitalize font-medium">{q.module}</span>
        <span> • {getTaskTypeFriendlyName(q.task_type)}</span>
      </div>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-hairline">
        <span
          className={`text-2xs font-mono font-semibold uppercase px-2 py-0.5 rounded ${
            passed
              ? "bg-success/10 text-success border border-success/20"
              : "bg-error-soft text-error-deep border border-error/20"
          }`}
        >
          {passed ? "Passed" : "Attempted"}
        </span>
        <span className="text-2xs font-mono text-mute">
          {a.score} / {a.max_score}
        </span>
      </div>
    </Link>
  );
}

function AttemptRow({ attempt: a }: { attempt: Attempt }) {
  const q = a.questions;
  if (!q) return null;
  const passed = a.is_correct;
  return (
    <tr className="hover:bg-canvas-soft transition">
      <td className="py-4 px-6">
        <Link
          href={`/questions/${q.module}/${mapDbToUrlTaskType(q.task_type)}/${q.id}`}
          className="text-body-sm-strong font-medium text-ink hover:text-link hover:underline transition truncate max-w-[280px] block"
        >
          {q.title || "Untitled Question"}
        </Link>
      </td>
      <td className="py-4 px-6 text-xs text-body">
        <span className="capitalize font-medium">{q.module}</span>
        <span className="text-mute font-normal"> • {getTaskTypeFriendlyName(q.task_type)}</span>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xs font-mono px-2 py-0.5 rounded font-semibold uppercase ${
              passed
                ? "bg-success/10 text-success border border-success/20"
                : "bg-error-soft text-error-deep border border-error/20"
            }`}
          >
            {passed ? "Passed" : "Attempted"}
          </span>
          <span className="text-xs font-mono text-mute">
            {a.score} / {a.max_score}
          </span>
        </div>
      </td>
      <td className="py-4 px-6 text-xs text-mute font-mono whitespace-nowrap">
        <Calendar className="w-3 h-3 inline mr-1.5 -mt-0.5" />
        {formatRelativeDate(a.attempted_at)}
      </td>
    </tr>
  );
}
