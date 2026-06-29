import React from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import QuestionAttemptClient from "./QuestionAttemptClient";
import { mapUrlToDbTaskType, transformQuestionContent } from "@/lib/taskTypeMapper";

interface PageProps {
  params: {
    module: string;
    "task-type": string;
    id: string;
  };
}

export default async function QuestionAttemptPage({ params }: PageProps) {
  const moduleParam = params.module;
  const taskTypeParam = params["task-type"];
  const idParam = params.id;

  const supabase = createClient();

  // Validate active auth session (memoised per request).
  let user = await getCurrentUser();

  if (!user) {
    // Fallback to our created test user ID for local browser testing
    user = { id: "4c97d8db-61f2-4405-988a-dcdd470d0318" } as any;
  }

  const dbTaskType = mapUrlToDbTaskType(moduleParam, taskTypeParam);

  // Run the three independent queries in parallel. Auth is the only call
  // that gates the rest, so we wait for it first; everything else keys off
  // user.id, but they don't key off each other.
  const [{ data: profile }, { data: question }, { data: questions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user!.id)
        .maybeSingle(),
      supabase
        .from("questions")
        .select("*")
        .eq("id", idParam)
        .eq("module", moduleParam)
        .eq("task_type", dbTaskType)
        .maybeSingle(),
      supabase
        .from("questions")
        .select("id, title")
        .eq("module", moduleParam)
        .eq("task_type", dbTaskType)
        .eq("is_active", true),
    ]);
  const plan = profile?.plan || "free";

  if (!question) {
    notFound();
  }

  const getQuestionNumber = (title: string): number => {
      const match = title.match(/#(\d+)/);
      return match ? parseInt(match[1], 10) : Infinity;
    };

    const sortedQuestions = [...(questions || [])].sort((a, b) => {
      const aNum = getQuestionNumber(a.title);
      const bNum = getQuestionNumber(b.title);
      if (aNum !== bNum) return aNum - bNum;
      return a.title.localeCompare(b.title);
    });

    const questionIds = sortedQuestions.map((q) => q.id);
    const currentIndex = questionIds.indexOf(idParam);

    // Sequential navigation. When the user finishes the last question we
    // wrap around to the first instead of dropping them on a "you did all
    // of them" dead-end — this matches the rotation behaviour of every
    // real PTE prep app and avoids the confusing "All Questions Done!"
    // screen on tasks like Summarize Spoken Text where users expect to
    // keep practising. If only one question exists in the DB (rare but
    // possible during early seeding), nextQuestionId stays null and the
    // standard "Return to Module" link is shown.
    let nextQuestionId: string | null = null;
    let prevQuestionId: string | null = null;
    if (currentIndex !== -1 && questionIds.length > 1) {
      nextQuestionId =
        currentIndex < questionIds.length - 1
          ? questionIds[currentIndex + 1]
          : questionIds[0];
      prevQuestionId =
        currentIndex > 0
          ? questionIds[currentIndex - 1]
          : questionIds[questionIds.length - 1];
    }

  const transformedQuestion = transformQuestionContent(question);

  return (
    <QuestionAttemptClient
      userId={user!.id}
      question={transformedQuestion}
      plan={plan}
      nextQuestionId={nextQuestionId}
      prevQuestionId={prevQuestionId}
      questionNumber={currentIndex !== -1 ? currentIndex + 1 : 1}
    />
  );
}
