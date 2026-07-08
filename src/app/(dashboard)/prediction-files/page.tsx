import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { planName, type PlanId } from "@/lib/plans";
import { PREDICTION_FILES } from "@/lib/predictionFiles";
import PredictionFilesClient from "./PredictionFilesClient";

export default async function PredictionFilesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = ((profile?.plan as PlanId) || "free") as PlanId;

  return (
    <div className="space-y-8 py-2 sm:py-4 select-none">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
          <Link href="/dashboard" className="hover:text-ink transition">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-body font-semibold">Prediction Files</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink flex items-center gap-2">
            Prediction Files
          </h1>
          <p className="text-sm text-mute mt-1">
            {planName(plan)} member — the latest predicted questions for every PTE Core task type.
          </p>
        </div>
      </div>

      <PredictionFilesClient files={PREDICTION_FILES} />
    </div>
  );
}
