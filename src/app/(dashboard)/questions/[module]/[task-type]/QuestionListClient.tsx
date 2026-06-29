"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface Question {
  id: string;
  title: string;
  content: any;
  difficulty: string;
}

interface AttemptInfo {
  score: number;
  max_score: number;
  is_correct: boolean;
}

interface QuestionListClientProps {
  moduleName: string;
  taskTypeName: string;
  title: string;
  description: string;
  initialQuestions: Question[];
  attemptMap: Record<string, AttemptInfo>;
}

export default function QuestionListClient({
  moduleName,
  taskTypeName,
  title,
  description,
  initialQuestions,
  attemptMap,
}: QuestionListClientProps) {
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredQuestions = useMemo(() => {
    const filtered = initialQuestions.filter((q) => {
      // 1. Search Query Match
      const previewText =
        q.content?.passage ||
        q.content?.passage_with_blanks ||
        q.content?.sentence ||
        q.content?.question ||
        q.content?.audio_transcript ||
        "";

      const searchMatch =
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        previewText.toLowerCase().includes(search.toLowerCase());

      // 2. Difficulty Filter Match
      const difficultyMatch =
        difficultyFilter === "all" || q.difficulty === difficultyFilter;

      // 3. Attempt Status Filter Match
      const attempt = attemptMap[q.id];
      const isComplete =
        taskTypeName !== "summarize-spoken-text" &&
        attempt &&
        (attempt.is_correct ||
          (attempt.score === attempt.max_score && attempt.max_score > 0));
      const isDone = attempt && !isComplete;

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "unattempted" && !attempt) ||
        (statusFilter === "attempted" && isDone) ||
        (statusFilter === "completed" && isComplete);

      return searchMatch && difficultyMatch && statusMatch;
    });

    const getQuestionNumber = (title: string): number => {
      const match = title.match(/#(\d+)/);
      return match ? parseInt(match[1], 10) : Infinity;
    };

    return [...filtered].sort((a, b) => {
      const aNum = getQuestionNumber(a.title);
      const bNum = getQuestionNumber(b.title);
      if (aNum !== bNum) {
        return aNum - bNum;
      }
      return a.title.localeCompare(b.title);
    });
  }, [initialQuestions, search, difficultyFilter, statusFilter, attemptMap]);

  // Helper formatting for PTE type display
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-success/10 text-success border border-success/20";
      case "medium":
        return "bg-warning-soft text-warning-deep border border-warning-deep/20";
      case "hard":
        return "bg-error-soft text-error-deep border border-error/20";
      default:
        return "bg-canvas-soft-2 text-mute border border-hairline";
    }
  };

  const getQuestionPreview = (content: any) => {
    let text =
      content?.passage ||
      content?.passage_with_blanks ||
      content?.sentence ||
      content?.question ||
      content?.audio_transcript ||
      content?.audio_transcript_with_blanks ||
      content?.scenario ||
      "";

    // Clean up ### and [blank_0] placeholders into a clean underline "_____"
    text = text.replace(/\[blank_\d+\]/g, "_____").replace(/###/g, "_____");

    if (text.length > 120) {
      return text.substring(0, 120) + "...";
    }
    return text;
  };

  const capitalizedModule = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

  return (
    <div className="space-y-8 py-2 select-none">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
          <Link href="/dashboard" className="hover:text-ink transition">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={`/questions/${moduleName.toLowerCase()}`}
            className="hover:text-ink transition"
          >
            {moduleName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-body font-semibold">{title}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-display-md tracking-tight font-semibold text-ink">
                {title}
              </h1>
              <span className="text-2xs font-mono bg-canvas border border-hairline px-2 py-0.5 rounded-full font-semibold text-body uppercase">
                {moduleName}
              </span>
            </div>
            <p className="text-body-sm text-mute max-w-3xl leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="text-xs font-mono bg-canvas-soft-2 border border-hairline px-3 py-1.5 rounded text-body font-medium">
              {filteredQuestions.length}{" "}
              {filteredQuestions.length === 1 ? "Question" : "Questions"}
            </span>
            <Link
              href={`/questions/${moduleName.toLowerCase()}`}
              className="h-9 px-4 border border-hairline hover:border-hairline-strong bg-canvas rounded-md text-xs font-medium text-ink hover:bg-canvas-soft-2 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-mute" />
              <span>Back to {capitalizedModule}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-canvas border border-hairline p-4 rounded-lg shadow-vercel-card flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-mute" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-canvas border border-hairline rounded-md text-xs text-ink focus:outline-none focus:border-hairline-strong transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
              Difficulty
            </span>
            <div className="flex border border-hairline rounded-md overflow-hidden bg-canvas-soft-2">
              {["all", "easy", "medium", "hard"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1 text-2xs font-medium capitalize transition cursor-pointer ${difficultyFilter === diff
                      ? "bg-canvas text-ink font-semibold border-r border-l border-hairline first:border-l-0 last:border-r-0"
                      : "text-body hover:text-ink"
                    }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
              Status
            </span>
            <div className="flex border border-hairline rounded-md overflow-hidden bg-canvas-soft-2">
              {[
                { id: "all", label: "All" },
                { id: "unattempted", label: "New" },
                { id: "attempted", label: "Done" },
                ...(taskTypeName !== "summarize-spoken-text" ? [{ id: "completed", label: "Complete" }] : []),
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.id)}
                  className={`px-3 py-1 text-2xs font-medium transition cursor-pointer ${statusFilter === status.id
                      ? "bg-canvas text-ink font-semibold border-r border-l border-hairline first:border-l-0 last:border-r-0"
                      : "text-body hover:text-ink"
                    }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions Card List */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q, idx) => {
            const attempt = attemptMap[q.id];
            const numMatch = q.title.match(/#(\d+)/);
            const srNo = numMatch ? numMatch[1] : (idx + 1).toString();
            const isWFD = taskTypeName === "write-from-dictation";
            const displayTitle = isWFD
              ? "Write from Dictation"
              : q.title.replace(/\s*#\d+/g, "");
            return (
              <div
                key={q.id}
                className="bg-canvas border border-hairline rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-hairline-strong transition duration-150 shadow-vercel-card"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-8 h-8 rounded-md bg-canvas-soft-2 border border-hairline flex items-center justify-center font-mono text-xs font-bold text-body shrink-0">
                    {srNo}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-body-sm-strong font-semibold text-ink group-hover:text-link truncate max-w-[320px]">
                        {displayTitle}
                      </h3>
                      <span
                        className={`text-3xs font-mono px-2 py-0.5 rounded font-semibold uppercase ${getDifficultyColor(
                          q.difficulty
                        )}`}
                      >
                        {q.difficulty}
                      </span>
                      {attempt && (
                        attempt.score === attempt.max_score && attempt.max_score > 0 && taskTypeName !== "summarize-spoken-text" ? (
                          <div className="flex items-center gap-1 text-emerald-600 text-2xs font-medium font-mono uppercase bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Complete</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-success text-2xs font-medium font-mono uppercase bg-success/5 border border-success/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            <span>Done</span>
                          </div>
                        )
                      )}
                    </div>
                    <p className="text-xs text-mute line-clamp-1">
                      {getQuestionPreview(q.content)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-hairline">
                  {attempt && taskTypeName !== "summarize-spoken-text" && (
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-3xs font-mono text-mute uppercase">
                        Best Score
                      </span>
                      <span className="text-xs font-mono font-semibold text-ink">
                        {attempt.score} / {attempt.max_score}
                      </span>
                    </div>
                  )}
                  <Link
                    href={`/questions/${moduleName}/${taskTypeName}/${q.id}`}
                    className="h-9 px-4 border border-hairline hover:border-hairline-strong bg-canvas rounded-md text-xs font-medium text-ink hover:bg-canvas-soft-2 transition flex items-center gap-2 group shrink-0 active:scale-[0.98] cursor-pointer"
                  >
                    <span>Start</span>
                    <ArrowRight className="w-3.5 h-3.5 text-mute group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-canvas border border-hairline rounded-lg p-16 text-center text-mute space-y-3 shadow-vercel-card">
            <BookOpen className="w-10 h-10 mx-auto text-mute opacity-40" />
            <p className="text-body-sm font-semibold text-ink">
              No questions found
            </p>
            <p className="text-2xs max-w-sm mx-auto leading-relaxed">
              Try adjusting your search criteria, difficulty sliders, or attempt
              status filters to find matching questions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
