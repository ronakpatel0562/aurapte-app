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
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
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
        .eq("id", user.id)
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
  const nextQuestionId =
    currentIndex !== -1 && currentIndex < questionIds.length - 1
      ? questionIds[currentIndex + 1]
      : null;

  const transformedQuestion = transformQuestionContent(question);

  return (
    <QuestionAttemptClient
      userId={user.id}
      question={transformedQuestion}
      plan={plan}
      nextQuestionId={nextQuestionId}
    />
  );
}
