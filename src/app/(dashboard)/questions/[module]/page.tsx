import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import { mapDbToUrlTaskType } from "@/lib/taskTypeMapper";
import {
  Mic,
  PenTool,
  BookOpenCheck,
  Headphones,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface PageProps {
  params: {
    module: string;
  };
}

const MODULE_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    bgGradient: string;
    tasks: {
      dbType: string;
      title: string;
      desc: string;
    }[];
  }
> = {
  speaking: {
    title: "Speaking",
    description: "Practice oral fluency, pronunciation, and quick spoken responses.",
    icon: Mic,
    color: "text-blue-500",
    bgGradient: "from-blue-500/10 to-indigo-500/5",
    tasks: [
      {
        dbType: "read_aloud",
        title: "Read Aloud",
        desc: "Read a short text aloud. Tests speaking and reading integration, pronunciation, and oral fluency.",
      },
      {
        dbType: "repeat_sentence",
        title: "Repeat Sentence",
        desc: "Listen to a sentence and repeat it exactly as heard. Tests speaking and listening integration, memory, and pronunciation.",
      },
      {
        dbType: "describe_image",
        title: "Describe Image",
        desc: "Describe an image, chart, or graph shown on screen. Tests speaking skills, structured analysis, and oral fluency.",
      },
      {
        dbType: "responding_to_situation",
        title: "Responding to Situation",
        desc: "Listen to or read a social situation, then record a spoken response. Tests speaking skills in conversational contexts.",
      },
      {
        dbType: "answer_short_question",
        title: "Answer Short Question",
        desc: "Answer a question with a single word or few words. Tests vocabulary, general knowledge, and quick listening.",
      },
    ],
  },
  writing: {
    title: "Writing",
    description: "Polish summary writing, professional emails, and essay responses.",
    icon: PenTool,
    color: "text-purple-500",
    bgGradient: "from-purple-500/10 to-pink-500/5",
    tasks: [
      {
        dbType: "summarize_written_text",
        title: "Summarize Written Text",
        desc: "Read a passage and write a one-sentence summary of 5 to 75 words. Tests reading comprehension and summary writing.",
      },
      {
        dbType: "write_an_email",
        title: "Write an Email",
        desc: "Draft a professional email responding to a given prompt and instructions. Tests written discourse and vocabulary.",
      },
    ],
  },
  reading: {
    title: "Reading",
    description: "Test your grammar, paragraph organization, and comprehension skills.",
    icon: BookOpenCheck,
    color: "text-emerald-500",
    bgGradient: "from-emerald-500/10 to-teal-500/5",
    tasks: [
      {
        dbType: "rw_fill_in_the_blanks",
        title: "Reading & Writing: Fill in the Blanks",
        desc: "Select the correct option from inline dropdown menus for each blank. Tests reading and writing grammar.",
      },
      {
        dbType: "reading_mcq_multiple",
        title: "Multiple Choice, Multiple Answers",
        desc: "Read a passage and select all correct options. Negative marking applies for wrong answers.",
      },
      {
        dbType: "reorder_paragraphs",
        title: "Re-order Paragraphs",
        desc: "Drag and drop shuffled paragraphs to restore the original logical flow. Tests reading cohesion and logic.",
      },
      {
        dbType: "reading_fill_in_the_blanks",
        title: "Reading: Fill in the Blanks",
        desc: "Select the best words from a drag-and-drop word bank to complete a passage. Tests reading grammar.",
      },
      {
        dbType: "reading_mcq_single",
        title: "Multiple Choice, Single Answer",
        desc: "Read a text and select the single correct option from a choice of four. Tests general comprehension.",
      },
    ],
  },
  listening: {
    title: "Listening",
    description: "Improve dictation, spelling, error spotting, and oral summary writing.",
    icon: Headphones,
    color: "text-amber-500",
    bgGradient: "from-amber-500/10 to-orange-500/5",
    tasks: [
      {
        dbType: "summarize_spoken_text",
        title: "Summarize Spoken Text",
        desc: "Listen to a spoken report and write a 20-30 word summary within 8 minutes.",
      },
      {
        dbType: "listening_mcq_multiple",
        title: "Multiple Choice, Multiple Answers",
        desc: "Listen to the recording and answer the multiple-choice question by selecting the correct responses. More than one response is correct.",
      },
      {
        dbType: "listening_fill_in_the_blanks",
        title: "Fill in the Blanks",
        desc: "Listen to a recording and type the missing words in the transcript blanks. Tests spelling and listening.",
      },
      {
        dbType: "listening_mcq_single",
        title: "Multiple Choice, Single Answer",
        desc: "Listen to a text and select the single correct option from a choice of four. Tests general comprehension.",
      },
      {
        dbType: "select_missing_word",
        title: "Select Missing Word",
        desc: "Listen to a recording that ends abruptly with a beep. Select the option that best completes the sentence.",
      },
      {
        dbType: "highlight_incorrect_words",
        title: "Highlight Incorrect Words",
        desc: "Listen to a recording and click words in the transcript that do not match what is spoken. Negative marking applies.",
      },
      {
        dbType: "write_from_dictation",
        title: "Write from Dictation",
        desc: "Listen to a short sentence and type it exactly as spoken. Tests spelling, memory, and listening.",
      },
    ],
  },
};

export default async function ModuleCategoriesPage({ params }: PageProps) {
  const moduleParam = params.module.toLowerCase();
  const metadata = MODULE_METADATA[moduleParam];

  if (!metadata) {
    notFound();
  }

  const supabase = createClient();

  // Validate active auth session. Memoised for the request — any other
  // server component on this page will get the same cached promise.
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fire the two independent queries in parallel. The previous code did
  // them sequentially, which on a slow network added a round-trip per
  // query and was the dominant cost on every module landing.
  const [{ data: questions }, { data: attempts }] = await Promise.all([
    supabase
      .from("questions")
      .select("id, task_type")
      .eq("module", moduleParam)
      .eq("is_active", true),
    supabase
      .from("user_attempts")
      .select("question_id, score, max_score, is_correct")
      .eq("user_id", user.id),
  ]);

  // Group questions by task type to compute totals
  const totalQuestionsByTaskType: Record<string, number> = {};
  questions?.forEach((q) => {
    totalQuestionsByTaskType[q.task_type] =
      (totalQuestionsByTaskType[q.task_type] || 0) + 1;
  });

  // Filter attempts in JS to get unique question counts per task type
  const attemptedSet = new Set<string>();
  const completedSet = new Set<string>();
  const completedCountsByTaskType: Record<string, number> = {};

  // Map question ID to its task type for easy lookup
  const questionIdToTaskType: Record<string, string> = {};
  questions?.forEach((q) => {
    questionIdToTaskType[q.id] = q.task_type;
  });

  attempts?.forEach((att) => {
    if (questionIdToTaskType[att.question_id]) {
      attemptedSet.add(att.question_id);
      
      const isCorrect = att.is_correct || (Number(att.score) === Number(att.max_score) && Number(att.max_score) > 0);
      if (isCorrect) {
        completedSet.add(att.question_id);
      }
    }
  });

  completedSet.forEach((qId) => {
    const taskType = questionIdToTaskType[qId];
    if (taskType) {
      completedCountsByTaskType[taskType] = (completedCountsByTaskType[taskType] || 0) + 1;
    }
  });

  const attemptedCountsByTaskType: Record<string, number> = {};
  attemptedSet.forEach((qId) => {
    const taskType = questionIdToTaskType[qId];
    if (taskType) {
      attemptedCountsByTaskType[taskType] = (attemptedCountsByTaskType[taskType] || 0) + 1;
    }
  });

  const ModuleIcon = metadata.icon;

  return (
    <div className="space-y-10 py-4 select-none font-geist">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">{metadata.title}</span>
      </div>

      {/* Header Banner with Gradient Strip */}
      <div className="relative bg-canvas border border-hairline rounded-xl p-8 shadow-vercel-card overflow-hidden">
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metadata.bgGradient}`}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg bg-canvas-soft border border-hairline flex items-center justify-center ${metadata.color}`}
              >
                <ModuleIcon className="w-5.5 h-5.5" />
              </div>
              <h1 className="text-display-md tracking-tight font-semibold text-ink">
                {metadata.title} Questions
              </h1>
            </div>
            <p className="text-body-sm text-mute max-w-2xl leading-relaxed">
              {metadata.description} Practice and master each question type
              to achieve your target PTE score.
            </p>
          </div>

          <div className="flex flex-col gap-1 items-start md:items-end justify-center px-4 py-3 rounded-lg bg-canvas-soft border border-hairline shrink-0 min-w-[150px]">
            <span className="text-3xs font-mono text-mute uppercase">Total Attempted</span>
            <span className="text-display-sm font-bold text-ink">
              {attemptedSet.size} <span className="text-xs font-normal text-mute">/ {questions?.length || 0}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Task Types Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
          Practice Tasks ({metadata.tasks.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metadata.tasks.map((task) => {
            const total = totalQuestionsByTaskType[task.dbType] || 0;
            const completed = task.dbType === "summarize_spoken_text"
              ? (attemptedCountsByTaskType[task.dbType] || 0)
              : (completedCountsByTaskType[task.dbType] || 0);
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const urlPath = mapDbToUrlTaskType(task.dbType);

            return (
              <div
                key={task.dbType}
                className="card-hover group relative bg-canvas border border-hairline rounded-xl p-6 flex flex-col justify-between overflow-hidden shadow-vercel-card"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metadata.bgGradient}`} />
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-base sm:text-lg text-ink font-semibold group-hover:text-link transition">
                      {task.title}
                    </h2>

                    {completed === total && total > 0 && (
                      <span className="flex items-center gap-1 text-2xs text-success font-semibold uppercase font-mono px-2 py-0.5 bg-success/10 border border-success/20 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-mute leading-relaxed pr-2">
                    {task.desc}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="mt-6 space-y-4">
                  {total > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-2xs font-mono text-mute">
                        <span>PROGRESS</span>
                        <span>
                          {completed} / {total} Completed ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-canvas-soft rounded-full overflow-hidden border border-hairline">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-hairline">
                    <span className="text-xs font-mono text-mute">
                      {total} {total === 1 ? "question" : "questions"}
                    </span>

                    <Link
                      href={`/questions/${moduleParam}/${urlPath}`}
                      className="text-xs font-medium text-mute group-hover:text-ink transition flex items-center gap-1.5"
                    >
                      <span>Start Practice</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-mute group-hover:text-ink" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
