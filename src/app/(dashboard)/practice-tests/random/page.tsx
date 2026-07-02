import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import { isPremiumPlan, type PlanId } from "@/lib/plans";
import RandomPracticeTestLauncher from "@/components/practice-tests/RandomPracticeTestLauncher";

export default async function RandomPracticeTestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = ((profile?.plan as PlanId) || "free") as PlanId;

  if (!isPremiumPlan(plan)) {
    redirect("/billing?from=random-practice-test");
  }

  // The launcher owns its own breadcrumb/header while a module is being
  // picked, then returns a bare <ExamRunner/> once generated — same pattern
  // as practice-tests/[testId]/page.tsx's exam-clone branch, so there's no
  // extra dashboard chrome wrapped around the fullscreen exam UI.
  return <RandomPracticeTestLauncher userId={user.id} />;
}
