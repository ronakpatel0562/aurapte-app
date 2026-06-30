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
 * duplicates, capitalization, grammar, and missing terminal punctuation.
 *
 * Styling mirrors the PTE Pearson feedback panel (image 3 reference):
 *   - Spelling errors render as solid peach/red pill badges (no border, soft
 *     red background, dark-red text).
 *   - Grammar / capitalization / punctuation issues use a softer amber pill
 *     so candidates can visually distinguish them.
 *
 * Below the inline view, a "Grammar & Spelling Analysis" section lists each
 * issue as a card with numbered header, plain-English message, and green
 * suggestion pills.
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

  const issueCount = analysis.issues.length;

  return (
    <div className="space-y-6 reveal-up">
      {/* Inline highlighted rendering of the original text */}
      <div className="bg-canvas border border-hairline rounded-md p-5 font-geist text-[15px] leading-relaxed text-ink whitespace-pre-wrap break-words select-text">
        {analysis.annotatedTokens.map((tok, idx) => (
          <Token key={idx} token={tok} />
        ))}
      </div>

      {/* Grammar & Spelling Analysis header — red dot only when issues exist */}
      <div className="pt-2 border-t border-hairline">
        <div className="flex items-center gap-2 text-sm font-bold text-ink mb-4 select-none">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              issueCount > 0 ? "bg-error" : "bg-success"
            }`}
          />
          Grammar &amp; Spelling Analysis ({issueCount}{" "}
          {issueCount === 1 ? "Issue" : "Issues"} Detected)
        </div>

        {issueCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.issues.map((issue, idx) => (
              <IssueCard
                key={`${issue.type}-${idx}-${issue.token}`}
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
  const isOtherIssue =
    token.issueType &&
    token.issueType !== "spelling" &&
    token.issueType !== "grammar";

  if (!isSpelling && !isGrammar && !isOtherIssue) {
    return <>{token.text}</>;
  }

  // PTE-style: solid peach/red pill for spelling, soft amber pill for grammar
  let pillClass = "";
  if (isSpelling) {
    pillClass = "bg-[#FBD7D9] text-[#B30000] font-medium";
  } else if (isGrammar) {
    pillClass = "bg-[#FFE9C7] text-[#8A4A05] font-medium";
  } else {
    // capitalization, duplication, punctuation
    pillClass = "bg-[#FFE9C7] text-[#8A4A05] font-medium";
  }

  const suggestions = token.suggestions ?? [];
  const tooltip = suggestions.length
    ? `Possible issue: "${token.text}". Suggestions: ${suggestions.join(", ")}`
    : `Issue: "${token.text}"`;

  return (
    <span
      className={`inline-block mx-0.5 px-1.5 py-0.5 rounded-md ${pillClass} cursor-help select-text`}
      title={tooltip}
    >
      {token.text}
    </span>
  );
}

function IssueCard({
  issue,
  number,
}: {
  issue: LinguisticIssue;
  number: number;
}) {
  const isSpelling = issue.type === "spelling";

  // Spelling issues get a red left rule; grammar/other get amber
  const borderClass = isSpelling ? "border-l-[#E11D29]" : "border-l-[#C7821C]";

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
    <div
      className={`bg-canvas border border-hairline rounded-md p-4 border-l-[3.5px] ${borderClass} shadow-sm space-y-3 transition hover:shadow-md duration-150`}
    >
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-mute uppercase tracking-widest select-none">
          Issue #{number} • {typeLabel}
        </div>
        <div className="text-[13px] text-ink leading-relaxed font-sans">
          {issue.message}
        </div>
      </div>

      {issue.suggestions && issue.suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline/60 text-[10px] font-bold uppercase tracking-wider text-mute select-none">
          <span>Suggestions:</span>
          <div className="flex flex-wrap gap-1.5">
            {issue.suggestions.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded border border-[#9DD8B6] bg-[#E6F7EE] text-[#0E7A47] font-semibold normal-case text-[11px] font-geist cursor-default"
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
