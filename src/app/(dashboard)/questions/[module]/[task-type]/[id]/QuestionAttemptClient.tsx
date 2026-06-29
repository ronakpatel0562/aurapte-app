"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapDbToUrlTaskType, getTaskTypeFriendlyName } from "@/lib/taskTypeMapper";

// Import Reading components
import RWFillBlanks from "@/components/questions/reading/RWFillBlanks";
import MCQMultipleReading from "@/components/questions/reading/MCQMultiple";
import ReorderParagraphs from "@/components/questions/reading/ReorderParagraphs";
import ReadingFillBlanks from "@/components/questions/reading/ReadingFillBlanks";
import MCQSingleReading from "@/components/questions/reading/MCQSingle";

// Import Listening components
import SummarizeSpoken from "@/components/questions/listening/SummarizeSpoken";
import MCQMultipleListening from "@/components/questions/listening/MCQMultiple";
import FillBlanksListening from "@/components/questions/listening/FillBlanks";
import MCQSingleListening from "@/components/questions/listening/MCQSingle";
import SelectMissing from "@/components/questions/listening/SelectMissing";
import HighlightWords from "@/components/questions/listening/HighlightWords";
import WriteDictation from "@/components/questions/listening/WriteDictation";

// Import Speaking / Writing components
import SpeakingPlaceholder from "@/components/questions/speaking/SpeakingPlaceholder";
import SummarizeText from "@/components/questions/writing/SummarizeText";
import WriteEmail from "@/components/questions/writing/WriteEmail";

interface Question {
  id: string;
  module: string;
  task_type: string;
  title: string;
  content: any;
  difficulty: string;
}

interface QuestionAttemptClientProps {
  userId: string;
  question: Question;
  plan?: string;
  nextQuestionId?: string | null;
  prevQuestionId?: string | null;
  questionNumber?: number;
}

export default function QuestionAttemptClient({
  userId,
  question,
  plan = "free",
  nextQuestionId,
  prevQuestionId,
  questionNumber = 1,
}: QuestionAttemptClientProps) {
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const startTimeRef = useRef<number>(Date.now());



  // Reset states on question change
  useEffect(() => {
    startTimeRef.current = Date.now();
    setHasSubmitted(false);
  }, [question]);

  const handleSubmitAttempt = async (
    score: number,
    maxScore: number,
    answers: any
  ) => {
    setSubmitting(true);
    setHasSubmitted(true);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_attempts").insert({
        user_id: userId,
        question_id: question.id,
        user_answer: answers,
        score,
        max_score: maxScore,
        is_correct: score === maxScore && maxScore > 0,
        time_taken_seconds: duration,
      });

      if (error) {
        console.error("Failed to save attempt to database:", error.message);
      }
    } catch (err) {
      console.error("Unexpected error saving attempt:", err);
    } finally {
      setSubmitting(false);
    }
  };



  const renderQuestionUI = () => {
    const type = question.task_type;
    const mod = question.module;

    if (mod === "speaking") {
      return <SpeakingPlaceholder question={question} type={type} />;
    }

    if (mod === "writing") {
      if (type === "summarize-written-text" || type === "summarize_written_text") {
        return (
          <SummarizeText
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "write-an-email" || type === "write_an_email") {
        return (
          <WriteEmail
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
    }

    if (mod === "reading") {
      if (type === "rw-fill-in-the-blanks" || type === "rw_fill_in_the_blanks") {
        return (
          <RWFillBlanks
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "multiple-choice-multiple" || type === "reading_mcq_multiple") {
        return (
          <MCQMultipleReading
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "reorder-paragraphs" || type === "reorder_paragraphs") {
        return (
          <ReorderParagraphs
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "reading-fill-in-the-blanks" || type === "reading_fill_in_the_blanks") {
        return (
          <ReadingFillBlanks
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "multiple-choice-single" || type === "reading_mcq_single") {
        return (
          <MCQSingleReading
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
    }

    if (mod === "listening") {
      if (type === "summarize-spoken-text" || type === "summarize_spoken_text") {
        return (
          <SummarizeSpoken
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
            questionNumber={questionNumber}
            nextQuestionId={nextQuestionId}
            isPremium={isPremium}
          />
        );
      }
      if (type === "multiple-choice-multiple" || type === "listening_mcq_multiple") {
        return (
          <MCQMultipleListening
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "fill-in-the-blanks" || type === "listening_fill_in_the_blanks") {
        return (
          <FillBlanksListening
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "multiple-choice-single" || type === "listening_mcq_single") {
        return (
          <MCQSingleListening
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "select-missing-word" || type === "select_missing_word") {
        return (
          <SelectMissing
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "highlight-incorrect-words" || type === "highlight_incorrect_words") {
        return (
          <HighlightWords
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
      if (type === "write-from-dictation" || type === "write_from_dictation") {
        return (
          <WriteDictation
            question={question}
            onSubmitAttempt={handleSubmitAttempt}
            isSubmitting={submitting}
          />
        );
      }
    }

    return (
      <div className="bg-canvas border border-hairline p-8 text-center text-mute rounded-lg font-geist shadow-vercel-card">
        Question type layout not resolved: {type} ({mod})
      </div>
    );
  };

  const getModuleUrl = () => {
    return `/questions/${question.module}/${mapDbToUrlTaskType(question.task_type)}`;
  };

  const formatTaskType = (type: string) => {
    return getTaskTypeFriendlyName(type);
  };

  const isPremium = plan === "premium";

  const isWFD = question.task_type === "write_from_dictation" || question.task_type === "write-from-dictation";
  const displayTitle = isWFD
    ? "Write from Dictation"
    : question.title.replace(/\s*#\d+/g, "");

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb — Dashboard > Module > Subcategory.
                The question title is intentionally NOT shown here because it's
                already rendered as the page <h1> below the breadcrumb. Keeping
                the title in the breadcrumb is redundant and makes the breadcrumb
                wrap awkwardly on mobile. */}
            <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase select-none">
              <Link href="/dashboard" className="hover:text-ink transition">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/questions/${question.module.toLowerCase()}`}
                className="hover:text-ink transition"
              >
                {question.module}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              {isPremium ? (
                <Link href={getModuleUrl()} className="hover:text-ink transition">
                  {formatTaskType(question.task_type)}
                </Link>
              ) : (
                <span className="text-mute">{formatTaskType(question.task_type)}</span>
              )}
            </div>

      {/* Title Header */}
      <div className="pb-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-display-md tracking-tight font-semibold text-ink">
            {displayTitle}
          </h1>
          <p className="text-body-sm text-mute mt-1 capitalize">
            {question.module} Module • Difficulty: {question.difficulty}
          </p>
        </div>

        {isPremium ? (
          <Link
            href={getModuleUrl()}
            className="h-9 px-4 border border-hairline hover:border-hairline-strong bg-canvas rounded-md text-xs font-medium text-ink hover:bg-canvas-soft-2 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-mute" />
            <span>Back to List</span>
          </Link>
        ) : (
          <Link
            href={`/questions/${question.module.toLowerCase()}`}
            className="h-9 px-4 border border-hairline hover:border-hairline-strong bg-canvas rounded-md text-xs font-medium text-ink hover:bg-canvas-soft-2 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-mute" />
            <span>Back to Module</span>
          </Link>
        )}
      </div>

      {/* Interactive Render */}
      <div>{renderQuestionUI()}</div>

      {/* Sequential Navigation.
                With the server-side rotation logic (page.tsx), nextQuestionId is
                null only when there's a single question in the DB for this task
                type. In that case we offer a "Back to Module" link rather than
                a confusing "All Questions Done!" dead-end. */}
            {hasSubmitted && (
              <div className="mt-8 pt-6 border-t border-hairline flex justify-between items-center select-none">
                <div>
                  {prevQuestionId && (
                    <Link
                      href={`/questions/${question.module}/${mapDbToUrlTaskType(question.task_type)}/${prevQuestionId}`}
                      className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] text-ink font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4 text-mute" />
                      <span>Previous Question</span>
                    </Link>
                  )}
                </div>
                <div>
                  {nextQuestionId ? (
                    <Link
                      href={`/questions/${question.module}/${mapDbToUrlTaskType(question.task_type)}/${nextQuestionId}`}
                      className="h-10 px-6 bg-primary text-on-primary hover:bg-opacity-90 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      href={isPremium ? getModuleUrl() : `/questions/${question.module.toLowerCase()}`}
                      className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] text-ink font-semibold"
                    >
                      <span>Back to {isPremium ? "List" : "Module"}</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
    </div>
  );
}
