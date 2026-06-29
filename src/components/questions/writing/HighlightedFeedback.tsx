"use client";

import React from "react";
import type {
  AnnotatedToken,
  LinguisticAnalysis,
  LinguisticIssue,
} from "@/lib/linguistics/analyze";

interface HighlightedFeedbackProps {
  analysis: LinguisticAnalysis | null;
  loading: boolean;
  rawText?: string;
}

/**
 * Renders the candidate's submitted text with inline highlights for spelling
 * duplicates, capitalization, grammar, and missing terminal punctuation. Each marker
 * shows a tooltip with a short explanation and suggestions.
 */
export default function HighlightedFeedback({
  analysis,
  loading,
  rawText = "",
}: HighlightedFeedbackProps) {
  if (loading && !analysis) {
    return (
      <div className="space-y-4 reveal-up">
        <div className="bg-canvas border border-hairline rounded-md p-4 font-geist text-sm leading-relaxed text-mute/60 whitespace-pre-wrap break-words select-text">
          {rawText}
        </div>
        <div className="text-2xs font-mono text-mute uppercase tracking-wider flex items-center gap-2 select-none animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-mute border-t-transparent animate-spin shrink-0" />
          Analyzing spelling and grammar…
        </div>
      </div>
    );
  }

  if (!analysis) {
    if (rawText) {
      return (
        <div className="bg-canvas border border-hairline rounded-md p-4 font-geist text-sm leading-relaxed text-ink whitespace-pre-wrap break-words select-text">
          {rawText}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-5 reveal-up">
      {/* Inline highlighted rendering of the original text */}
      <div className="bg-canvas border border-hairline rounded-md p-4 font-geist text-sm leading-relaxed text-ink whitespace-pre-wrap break-words select-text">
        {analysis.annotatedTokens.map((tok, idx) => (
          <Token key={idx} token={tok} />
        ))}
      </div>

      {/* Issues list formatted as premium cards */}
      <div className="pt-4 border-t border-hairline">
        <div className="flex items-center gap-2 text-2xs font-bold text-ink uppercase tracking-wider mb-4 select-none">
          <span className={`w-2 h-2 rounded-full shrink-0 ${analysis.issues.length > 0 ? "bg-error animate-pulse" : "bg-success"}`} />
          Grammar & Spelling Analysis ({analysis.issues.length} {analysis.issues.length === 1 ? "Issue" : "Issues"} Detected)
        </div>

        {analysis.issues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.issues.map((issue, idx) => (
              <IssueCard
                key={`${issue.type}-${idx}`}
                issue={issue}
                number={idx + 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-xs font-semibold text-success uppercase bg-success/5 border border-success/15 px-3 py-2 rounded-md font-mono flex items-center gap-1.5 select-none w-fit">
            <span>✓</span> No spelling or grammar issues detected.
          </div>
        )}
      </div>
    </div>
  );
}

function Token({ token }: { token: AnnotatedToken }) {
  const isSpelling = token.misspelled || token.issueType === "spelling";
  const isGrammar = token.issueType === "grammar";
  const isOtherIssue = token.issueType && token.issueType !== "spelling" && token.issueType !== "grammar";

  if (!isSpelling && !isGrammar && !isOtherIssue) {
    return <>{token.text}</>;
  }

  let bgClass = "";
  let textClass = "";
  let borderClass = "";

  if (isSpelling) {
    bgClass = "bg-error-soft/60";
    textClass = "text-error-deep font-semibold";
    borderClass = "border-error/20";
  } else if (isGrammar) {
    bgClass = "bg-warning-soft/70";
    textClass = "text-warning-deep font-semibold";
    borderClass = "border-warning/20";
  } else {
    // capitalization, duplication, punctuation
    bgClass = "bg-warning-soft/70";
    textClass = "text-warning-deep font-semibold";
    borderClass = "border-warning/20";
  }

  const suggestions = token.suggestions ?? [];
  const tooltip = suggestions.length
    ? `Possible issue: "${token.text}". Suggestions: ${suggestions.join(", ")}`
    : `Issue: "${token.text}"`;

  return (
    <span
      className={`inline-block mx-0.5 px-1 py-0.5 rounded border ${bgClass} ${textClass} ${borderClass} cursor-help transition-colors select-text`}
      title={tooltip}
    >
      {token.text}
    </span>
  );
}

function IssueCard({ issue, number }: { issue: LinguisticIssue; number: number }) {
  const isSpelling = issue.type === "spelling";
  
  const borderClass = isSpelling ? "border-l-error" : "border-l-warning-deep";
  
  let typeLabel = "GRAMMAR";
  if (isSpelling) {
    typeLabel = "POSSIBLE TYPO";
  } else if (issue.type === "capitalization") {
    typeLabel = "GRAMMAR (CAPITALIZATION)";
  } else if (issue.type === "punctuation") {
    typeLabel = "GRAMMAR (PUNCTUATION)";
  } else if (issue.type === "duplication") {
    typeLabel = "GRAMMAR (DUPLICATION)";
  }

  return (
    <div className={`bg-canvas border border-hairline rounded-md p-4 border-l-[3.5px] ${borderClass} shadow-sm space-y-3 flex flex-col justify-between transition hover:shadow-md duration-150`}>
      <div className="space-y-1.5">
        <div className="text-4xs font-bold text-mute uppercase tracking-widest select-none">
          Issue #{number} • {typeLabel}
        </div>
        <div className="text-xs text-ink leading-relaxed font-sans">
          {issue.message}
        </div>
      </div>
      
      {issue.suggestions && issue.suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline/50 text-4xs font-bold uppercase tracking-wider text-mute select-none">
          <span>Suggestions:</span>
          <div className="flex flex-wrap gap-1.5">
            {issue.suggestions.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded border border-success/20 bg-success/5 text-success font-semibold normal-case text-3xs font-geist transition-colors hover:bg-success/10 cursor-default"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
