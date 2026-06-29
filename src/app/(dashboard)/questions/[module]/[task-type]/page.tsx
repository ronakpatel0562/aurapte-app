import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import QuestionListClient from "./QuestionListClient";
import { mapUrlToDbTaskType, transformQuestionContent } from "@/lib/taskTypeMapper";

interface PageProps {
  params: {
    module: string;
    "task-type": string;
  };
}

const TASK_DESCRIPTIONS: Record<string, { title: string; desc: string }> = {
  // Speaking
  "read-aloud": {
    title: "Read Aloud",
    desc: "Read a short text aloud. Tests speaking and reading integration, pronunciation, and oral fluency.",
  },
  "repeat-sentence": {
    title: "Repeat Sentence",
    desc: "Listen to a sentence and repeat it exactly as heard. Tests speaking and listening integration, memory, and pronunciation.",
  },
  "describe-image": {
    title: "Describe Image",
    desc: "Describe an image, chart, or graph shown on screen. Tests speaking skills, structured analysis, and oral fluency.",
  },
  "responding-to-situation": {
    title: "Responding to Situation",
    desc: "Listen to or read a social situation, then record a spoken response. Tests speaking skills in conversational contexts.",
  },
  "answer-short-question": {
    title: "Answer Short Question",
    desc: "Answer a question with a single word or few words. Tests vocabulary, general knowledge, and quick listening.",
  },
  // Writing
  "summarize-written-text": {
    title: "Summarize Written Text",
    desc: "Read a passage and write a one-sentence summary of 5 to 75 words. Tests reading comprehension and summary writing.",
  },
  "write-an-email": {
    title: "Write an Email",
    desc: "Draft a professional email responding to a given prompt and instructions. Tests written discourse and vocabulary.",
  },
  // Reading
  "rw-fill-in-the-blanks": {
    title: "Reading & Writing: Fill in the Blanks",
    desc: "Select the correct option from inline dropdown menus for each blank. Tests reading and writing grammar.",
  },
  "multiple-choice-multiple": {
    title: "Multiple Choice, Multiple Answers",
    desc: "Read or listen to a passage and select all correct options. Negative marking applies for wrong answers.",
  },
  "reorder-paragraphs": {
    title: "Re-order Paragraphs",
    desc: "Drag and drop shuffled paragraphs to restore the original logical flow. Tests reading cohesion and logic.",
  },
  "reading-fill-in-the-blanks": {
    title: "Reading: Fill in the Blanks",
    desc: "Select the best words from a drag-and-drop word bank to complete a passage. Tests reading grammar.",
  },
  "multiple-choice-single": {
    title: "Multiple Choice, Single Answer",
    desc: "Read or listen to a text and select the single correct option from a choice of four. Tests general comprehension.",
  },
  // Listening
  "summarize-spoken-text": {
    title: "Summarize Spoken Text",
    desc: "You will hear a short report. Write a summary of 20-30 words. You have 8 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points presented in the lecture.",
  },
  "fill-in-the-blanks": {
    title: "Fill in the Blanks",
    desc: "Listen to a recording and type the missing words in the transcript blanks. Tests spelling and listening.",
  },
  "select-missing-word": {
    title: "Select Missing Word",
    desc: "Listen to a recording that ends abruptly with a beep. Select the option that best completes the sentence.",
  },
  "highlight-incorrect-words": {
    title: "Highlight Incorrect Words",
    desc: "Listen to a recording and click words in the transcript that do not match what is spoken. Negative marking applies.",
  },
  "write-from-dictation": {
    title: "Write from Dictation",
    desc: "Listen to a short sentence and type it exactly as spoken. Tests spelling, memory, and listening.",
  },
};

export default async function QuestionListPage({ params }: PageProps) {
  const moduleParam = params.module;
  const taskTypeParam = params["task-type"];

  const supabase = createClient();

  // Get current user (memoised per request).
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const dbTaskType = mapUrlToDbTaskType(moduleParam, taskTypeParam);

  // Fetch user profile, attempts, and the question list in parallel. The
  // previous code did these sequentially, costing three Supabase round-
  // trips per click. On a slow network that added 1–2 seconds of freeze
  // before the page could redirect for free-plan users.
  const [{ data: profile }, { data: attempts }, { data: questions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_attempts")
        .select("question_id, score, max_score, is_correct")
        .eq("user_id", user.id),
      supabase
        .from("questions")
        .select("id, title, content, difficulty, created_at")
        .eq("module", moduleParam)
        .eq("task_type", dbTaskType)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ]);
  const plan = profile?.plan || "free";

  // If user is on Plan 1 (free), redirect to the first unattempted question in this category
  if (plan === "free" && questions && questions.length > 0) {
    const attemptedIds = new Set(attempts?.map((a) => a.question_id) || []);
    const unattempted = questions.find((q) => !attemptedIds.has(q.id));
    const targetId = unattempted ? unattempted.id : questions[0].id;
    
    redirect(`/questions/${moduleParam}/${taskTypeParam}/${targetId}`);
  }

  const transformedQuestions = (questions || []).map(transformQuestionContent);

  // Map attempt status by question_id (aggregating to keep the best attempt)
  const attemptMap: Record<
    string,
    { score: number; max_score: number; is_correct: boolean }
  > = {};
  attempts?.forEach((att) => {
    const existing = attemptMap[att.question_id];
    const isThisBetter =
      !existing ||
      (att.is_correct && !existing.is_correct) ||
      Number(att.score) / Math.max(1, Number(att.max_score)) >
        existing.score / Math.max(1, existing.max_score);

    if (isThisBetter) {
      attemptMap[att.question_id] = {
        score: Number(att.score),
        max_score: Number(att.max_score),
        is_correct:
          att.is_correct ||
          (Number(att.score) === Number(att.max_score) && Number(att.max_score) > 0),
      };
    }
  });

  const taskDetails = { ...(TASK_DESCRIPTIONS[taskTypeParam] || {
    title: taskTypeParam.replace(/-/g, " "),
    desc: "Browse and practice official PTE-style tasks.",
  }) };

  if (moduleParam === "listening" && taskTypeParam === "multiple-choice-multiple") {
    taskDetails.desc = "Listen to the recording and answer the multiple-choice question by selecting the correct responses. More than one response is correct.";
  }

  return (
    <QuestionListClient
      moduleName={moduleParam}
      taskTypeName={taskTypeParam}
      title={taskDetails.title}
      description={taskDetails.desc}
      initialQuestions={transformedQuestions}
      attemptMap={attemptMap}
    />
  );
}
