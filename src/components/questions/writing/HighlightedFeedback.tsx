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
}

/**
 * Renders the candidate's submitted text with inline highlights for spelling
 * duplicates, capitalization, and missing terminal punctuation. Each marker
 * shows a tooltip with a short explanation and (for misspellings) the top
 * dictionary suggestions.
 */
export default function HighlightedFeedback({
  analysis,
  loading,
}: HighlightedFeedbackProps) {
  if (loading) {
    return (
      <div className="text-3xs font-mono text-mute uppercase tracking-wider py-2">
        Loading spell-checker…
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-3">
      {/* Inline highlighted rendering of the original text */}
      <div className="bg-canvas border border-hairline rounded-md p-4 font-geist text-sm leading-relaxed text-ink whitespace-pre-wrap break-words">
        {analysis.annotatedTokens.map((tok, idx) => (
          <Token key={idx} token={tok} />
        ))}
      </div>

      {/* Compact issues list */}
      {analysis.issues.length > 0 ? (
        <ul className="space-y-1.5">
          {analysis.issues.map((issue, idx) => (
            <IssueRow key={`${issue.type}-${idx}`} issue={issue} />
          ))}
        </ul>
      ) : (
        <div className="text-3xs font-mono text-success uppercase tracking-wider">
          No spelling or grammar issues detected.
        </div>
      )}
    </div>
  );
}

function Token({ token }: { token: AnnotatedToken }) {
  if (token.kind !== "word" || !token.misspelled) {
    return <>{token.text}</>;
  }

  const suggestions = token.suggestions ?? [];
  const tooltip = suggestions.length
    ? `Possible spelling: "${token.text}". Did you mean: ${suggestions
        .map((s) => `"${s}"`)
        .join(", ")}?`
    : `Possible spelling: "${token.text}"`;

  return (
    <span
      className="underline decoration-error decoration-wavy underline-offset-4 cursor-help text-error-deep"
      title={tooltip}
    >
      {token.text}
    </span>
  );
}

function IssueRow({ issue }: { issue: LinguisticIssue }) {
  const palette: Record<LinguisticIssue["type"], string> = {
    spelling:
      "bg-error-soft text-error-deep border border-error/20",
    capitalization:
      "bg-warning-soft text-warning-deep border border-warning-deep/20",
    punctuation:
      "bg-warning-soft text-warning-deep border border-warning-deep/20",
    duplication:
      "bg-warning-soft text-warning-deep border border-warning-deep/20",
  };

  const label: Record<LinguisticIssue["type"], string> = {
    spelling: "Spelling",
    capitalization: "Capitalization",
    punctuation: "Punctuation",
    duplication: "Duplication",
  };

  return (
    <li className="flex items-start gap-2 text-3xs font-mono uppercase tracking-wider">
      <span
        className={`px-2 py-0.5 rounded ${palette[issue.type]} shrink-0`}
      >
        {label[issue.type]}
      </span>
      <span className="text-mute normal-case font-geist text-body-sm tracking-normal">
        {issue.message}
        {issue.suggestions && issue.suggestions.length > 0 && (
          <>
            {" "}
            <span className="text-ink font-semibold">
              Try:
            </span>{" "}
            {issue.suggestions.map((s, i) => (
              <span key={s}>
                <span className="text-ink font-semibold">{s}</span>
                {i < issue.suggestions!.length - 1 ? ", " : ""}
              </span>
            ))}
          </>
        )}
      </span>
    </li>
  );
}
