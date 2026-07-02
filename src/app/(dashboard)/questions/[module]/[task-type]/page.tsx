import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import QuestionListClient from "./QuestionListClient";
import { mapUrlToDbTaskType, transformQuestionContent } from "@/lib/taskTypeMapper";
import { isPremiumPlan } from "@/lib/plans";

interface PageProps {
  params: {
    module: string;
    "task-type": string;
  };
}

/**
 * Per-task-type metadata shown on the list page:
 *  - title  : human-readable task name
 *  - desc   : the long description shown under the title
 *  - summary: short one-line instruction (≤ ~110 chars) reused inside the
 *             question card itself when the DB doesn't supply `instruction`.
 *             For writing tasks it matches the PTE Pearson header.
 */
const TASK_DESCRIPTIONS: Record<
  string,
  { title: string; desc: string; summary: string }
> = {
  // Speaking
  "read-aloud": {
    title: "Read Aloud",
    desc: "",
    summary:
      "Look at the text below. In 35 seconds, you must read this text aloud as naturally and clearly as possible. You have 40 seconds to read aloud. Read the text aloud and record your response.",
  },
  "repeat-sentence": {
    title: "Repeat Sentence",
    desc: "",
    summary:
      "You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.",
  },
  "describe-image": {
    title: "Describe Image",
    desc: "",
    summary:
      "Look at the graph below. In 25 seconds, please speak into the microphone and describe in detail what the graph is showing. You will have 40 seconds to give your response.",
  },
  "responding-to-situation": {
    title: "Responding to Situation",
    desc: "",
    summary:
      "Listen to and read a description of a situation. You will have 20 seconds to think about your answer. Then you will hear a beep. You will have 40 seconds to answer the question. Please answer as completely as you can.",
  },
  "answer-short-question": {
    title: "Answer Short Question",
    desc: "",
    summary:
      "You will hear a question. Please give a simple and short answer. Often just one or a few words are enough.",
  },
  // Writing
  "summarize-written-text": {
    title: "Summarize Written Text",
    desc: "Read a passage and write a one-sentence summary of 5 to 75 words. Tests reading comprehension and summary writing.",
    summary:
      "Read the passage below and summarize it using one sentence. Type your response in the box at the bottom of the screen. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.",
  },
  "write-an-email": {
    title: "Write an Email",
    desc: "Draft a professional email responding to a given prompt and instructions. Tests written discourse and vocabulary.",
    summary:
      "Read the situation below and write an email to resolve the issue. Your response will be judged on the quality of your writing and how well you address the situation.",
  },
  // Reading
  "rw-fill-in-the-blanks": {
    title: "Reading & Writing: Fill in the Blanks",
    desc: "Select the correct option from inline dropdown menus for each blank. Tests reading and writing grammar.",
    summary:
      "Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.",
  },
  "multiple-choice-multiple": {
    title: "Multiple Choice, Multiple Answers",
    desc: "Read or listen to a passage and select all correct options. Negative marking applies for wrong answers.",
    summary:
      "Read the text and answer the multiple-choice question by selecting the correct responses. More than one response is correct.",
  },
  "reorder-paragraphs": {
    title: "Re-order Paragraphs",
    desc: "Drag and drop shuffled paragraphs to restore the original logical flow. Tests reading cohesion and logic.",
    summary:
      "The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.",
  },
  "reading-fill-in-the-blanks": {
    title: "Reading: Fill in the Blanks",
    desc: "Select the best words from a drag-and-drop word bank to complete a passage. Tests reading grammar.",
    summary:
      "In the text below some words are missing. Drag words from the box below to the appropriate place in the text. To undo an answer choice, drag the word back to the box below the text.",
  },
  "multiple-choice-single": {
    title: "Multiple Choice, Single Answer",
    desc: "Read or listen to a text and select the single correct option from a choice of four. Tests general comprehension.",
    summary:
      "Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.",
  },
  // Listening
  "summarize-spoken-text": {
    title: "Summarize Spoken Text",
    desc: "You will hear a short report. Write a summary of 20-30 words. You have 8 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points presented in the lecture.",
    summary:
      "You will hear a short report. Write a summary of 20-30 words. You have 8 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points presented in the lecture.",
  },
  "fill-in-the-blanks": {
    title: "Fill in the Blanks",
    desc: "Listen to a recording and type the missing words in the transcript blanks. Tests spelling and listening.",
    summary:
      "You will hear a recording. Type the missing words in each blank.",
  },
  "select-missing-word": {
    title: "Select Missing Word",
    desc: "Listen to a recording that ends abruptly with a beep. Select the option that best completes the sentence.",
    summary:
      "You will hear a recording. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.",
  },
  "highlight-incorrect-words": {
    title: "Highlight Incorrect Words",
    desc: "Listen to a recording and click words in the transcript that do not match what is spoken. Negative marking applies.",
    summary:
      "You will hear a recording. Below is a transcript of the recording. Some words in the transcription differ from what the speaker(s) said. Click on the words that are different.",
  },
  "write-from-dictation": {
    title: "Write from Dictation",
    desc: "Listen to a short sentence and type it exactly as spoken. Tests spelling, memory, and listening.",
    summary:
      "You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.",
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

  // Fetch attempts, the question list, and the plan in parallel so every plan
  // can see the full list view and jump straight to any question, the same
  // way Pro-plan users already could — plan only gates the filter controls.
  const [{ data: attempts }, { data: questions }, { data: profile }] = await Promise.all([
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
      .eq("pool", "shared")
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const isPremium = isPremiumPlan(profile?.plan);

  const transformedQuestions = (questions || []).map(transformQuestionContent);

  // Prefer the per-question `instruction` field (if the DB has one set)
  // as the instruction shown in the list view header. Falls back to the
  // hard-coded summary in TASK_DESCRIPTIONS for modules that don't ship
  // per-question instructions yet. This keeps the upper wording in sync
  // with what each question actually displays at the top of its card.
  const listInstruction =
    transformedQuestions.find((q) => q?.content?.instruction)?.content
      ?.instruction || "";

  // Map attempt status by question_id (aggregating to keep the best attempt).
  // Starter/free users never get a score persisted (see QuestionAttemptClient),
  // but guard here too so any pre-existing rows for a since-downgraded user
  // don't resurface a "Best Score" / "Done" badge in the list view.
  const attemptMap: Record<
    string,
    { score: number; max_score: number; is_correct: boolean }
  > = {};
  (isPremium ? attempts : [])?.forEach((att) => {
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

  const taskDetails = {
    ...(TASK_DESCRIPTIONS[taskTypeParam] || {
      title: taskTypeParam.replace(/-/g, " "),
      desc: "Browse and practice official PTE-style tasks.",
      summary:
        "Browse and practice official PTE-style tasks. Each question mirrors the official PTE format and tests the corresponding enabling skill.",
    }),
  };

  if (moduleParam === "listening") {
    if (taskTypeParam === "multiple-choice-multiple") {
      taskDetails.desc = "Listen to the recording and answer the multiple-choice question by selecting the correct responses. More than one response is correct.";
      taskDetails.summary = "Listen to the recording and answer the multiple-choice question by selecting the correct responses. More than one response is correct.";
    } else if (taskTypeParam === "multiple-choice-single") {
      taskDetails.desc = "Listen to the recording and answer the multiple-choice question by selecting the correct response. Only one response is correct.";
      taskDetails.summary = "Listen to the recording and answer the multiple-choice question by selecting the correct response. Only one response is correct.";
    } else if (taskTypeParam === "fill-in-the-blanks") {
      taskDetails.desc = "You will hear a recording. Type the missing words in each blank.";
      taskDetails.summary = "You will hear a recording. Type the missing words in each blank.";
    } else if (taskTypeParam === "select-missing-word") {
      taskDetails.desc = "You will hear a recording. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.";
      taskDetails.summary = "You will hear a recording. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.";
    } else if (taskTypeParam === "highlight-incorrect-words") {
      taskDetails.desc = "You will hear a recording. Below is a transcript of the recording. Some words in the transcription differ from what the speaker(s) said. Please click on the words that are different.";
      taskDetails.summary = "You will hear a recording. Below is a transcript of the recording. Some words in the transcription differ from what the speaker(s) said. Please click on the words that are different.";
    } else if (taskTypeParam === "write-from-dictation") {
      taskDetails.desc = "You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.";
      taskDetails.summary = "You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.";
    }
  } else if (moduleParam === "reading") {
    if (taskTypeParam === "rw-fill-in-the-blanks") {
      taskDetails.desc = "Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.";
      taskDetails.summary = "Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.";
    } else if (taskTypeParam === "multiple-choice-multiple") {
      taskDetails.desc = "Read the text and answer the multiple-choice question by selecting the correct responses. More than one response is correct.";
      taskDetails.summary = "Read the text and answer the multiple-choice question by selecting the correct responses. More than one response is correct.";
    } else if (taskTypeParam === "reorder-paragraphs") {
      taskDetails.desc = "The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.";
      taskDetails.summary = "The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.";
    } else if (taskTypeParam === "reading-fill-in-the-blanks") {
      taskDetails.desc = "In the text below some words are missing. Drag words from the box below to the appropriate place in the text. To undo an answer choice, drag the word back to the box below the text.";
      taskDetails.summary = "In the text below some words are missing. Drag words from the box below to the appropriate place in the text. To undo an answer choice, drag the word back to the box below the text.";
    } else if (taskTypeParam === "multiple-choice-single") {
      taskDetails.desc = "Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.";
      taskDetails.summary = "Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.";
    }
  }

  // For Writing tasks the upper wording should be the instruction shipped
  // with the question itself (replacing the static description+summary
  // pairing), so the list view shows a single instruction block that
  // matches what the user sees inside the question card. For other
  // modules we keep the static TASK_DESCRIPTIONS text.
  const isWritingTask =
    moduleParam === "writing" &&
    (taskTypeParam === "summarize-written-text" ||
      taskTypeParam === "write-an-email");
  const finalDescription = isWritingTask
    ? listInstruction || taskDetails.summary
    : taskDetails.desc;
  const finalSummary = isWritingTask ? "" : taskDetails.summary;

  return (
    <QuestionListClient
      moduleName={moduleParam}
      taskTypeName={taskTypeParam}
      title={taskDetails.title}
      description={finalDescription}
      summary={finalSummary}
      initialQuestions={transformedQuestions}
      attemptMap={attemptMap}
      isPremium={isPremium}
    />
  );
}
