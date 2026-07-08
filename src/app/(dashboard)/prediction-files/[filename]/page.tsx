import React from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getPredictionFile } from "@/lib/predictionFiles";

interface PageProps {
  params: { filename: string };
}

export default async function PredictionFileViewerPage({ params }: PageProps) {
  const file = getPredictionFile(params.filename);
  if (!file) notFound();

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_expiry")
    .eq("id", user.id)
    .maybeSingle();

  const hasActivePlan =
    !!profile?.plan_expiry && new Date(profile.plan_expiry).getTime() > Date.now();

  if (!hasActivePlan) {
    redirect("/billing?from=prediction-files");
  }

  return (
    <div className="space-y-4 py-2 sm:py-4 select-none flex flex-col h-[calc(100vh-7rem)]">
      <div className="space-y-2 shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
          <Link href="/dashboard" className="hover:text-ink transition">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/prediction-files" className="hover:text-ink transition">
            Prediction Files
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-body font-semibold truncate">{file.title}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-ink truncate">{file.title}</h1>
          <Link
            href="/prediction-files"
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 bg-canvas-soft-2 border border-hairline hover:bg-canvas-soft text-ink font-medium text-xs rounded-md transition duration-150"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-canvas border border-hairline rounded-xl overflow-hidden shadow-vercel-card">
        <iframe
          src={`/api/prediction-files/${file.filename}`}
          title={file.title}
          className="w-full h-full bg-white"
        />
      </div>
    </div>
  );
}
