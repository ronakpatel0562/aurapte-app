import React from "react";
import Link from "next/link";
import { Lock, FileDown, ChevronRight, Award, Check, Sparkles, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS, planName, isPremiumPlan, type PlanId } from "@/lib/plans";

export default async function SpecialisedTipsPage() {
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
  const isPremium = isPremiumPlan(plan);

  if (!isPremium) {
    return (
      <div className="py-6 sm:py-8 max-w-2xl mx-auto text-center space-y-8 select-none px-4">
        <div className="relative w-20 h-20 bg-warning-soft rounded-2xl flex items-center justify-center border border-warning/20 mx-auto shadow-vercel-card">
          <Lock className="w-10 h-10 text-warning-deep animate-pulse" />
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-warning-deep" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Unlock Specialised Tips PDF
          </h1>
          <p className="text-sm text-mute leading-relaxed max-w-lg mx-auto">
            Get instant access to our expert, curated PDF guide loaded with strategic templates, vocabulary sheets, and score-maximizer tips for all PTE modules.
          </p>
        </div>

        <div className="bg-canvas border border-hairline rounded-xl p-6 text-left space-y-4 shadow-vercel-card">
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-hairline pb-2.5">
            What&apos;s Included in the PDF Guide:
          </h3>
          <ul className="space-y-3">
            {[
              "Speaking templates for Describe Image and Retell Lecture",
              "Writing structures for Write Essay and Write an Email to score 90/90",
              "Listening strategies for Write From Dictation and Summarize Spoken Text",
              "High-frequency vocabulary and collocations lists for Reading Fill in the Blanks",
              "Common mistakes to avoid that drag down spelling and grammar scores",
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-body">
                <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/dashboard"
            className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center active:scale-[0.99] text-ink font-semibold"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/billing"
            className="h-10 px-6 bg-gradient-to-r from-gradient-develop-start to-gradient-preview-start text-white hover:opacity-95 font-medium text-sm rounded-md shadow-md transition duration-150 flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade to {PLANS.premium.name}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2 sm:py-4 select-none">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
          <Link href="/dashboard" className="hover:text-ink transition">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-body font-semibold">Specialised Tips</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink flex items-center gap-2">
              Specialised Tips & Templates
            </h1>
            <p className="text-sm text-mute mt-1">
              {planName(plan)} member — expert strategies and high-scoring templates for PTE Academic.
            </p>
          </div>

          <a
            href="data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvUGFnZXMKICAgICAvS2lkcyBbIDMgMCBSIF0KICAgICAvQ291bnQgMQogID4+CmVuZG9iagozIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2UKICAgICAvUGFyZW50IDIgMCBSCiAgICAgL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXQogICAgIC9Db250ZW50cyA0IDAgUgogICAgIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDUgMCBSID4+ID4+CiAgPj4KZW5kb2JqCjQgMCBvYmoKICA8PCAvTGVuZ3RoIDY5ID4+CnN0cmVhbQpCVAovRjEgMjQgVGYKMTAwIDcwMCBUZAooQXVyYVBURSBQcmVtaXVtIFNwZWNpYWxpc2VkIFRpcHMgUERGKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKICA8PCAvVHlwZSAvRm9udAogICAgIC9TdWJ0eXBlIC9UeXBlMQogICAgIC9CYXNlRm9udCAvSGVsdmV0aWNhCiAgPj4KZW5kb2JqCnRyYWlsZXIKICA8PCAvUm9vdCAxIDAgUgogID4+CiUlRU9GCg=="
            download="AuraPTE_Specialised_Tips.pdf"
            className="h-10 px-5 bg-gradient-to-r from-gradient-develop-start to-gradient-preview-start text-white hover:opacity-95 font-medium text-sm rounded-md shadow-md transition duration-150 flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF Guide</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
        {[
          {
            module: "Speaking",
            title: "Describe Image Template",
            strategy: "Maintain a steady, continuous oral fluency rate without pauses. Focus strictly on key visual indicators (highest/lowest points, titles, and legends) rather than analyzing the data.",
            tip: "Template: 'The given bar chart provides information about [Title]. It is clear from the image that the highest value is represented by [Category A], which is around [Value]. On the other hand, the lowest value is represented by [Category B], which is around [Value]. In conclusion, the chart shows key trends over the given period.'",
          },
          {
            module: "Writing",
            title: "Summarize Written Text Rule",
            strategy: "Your response must be a single, complete sentence of 5 to 75 words. Use simple compound or complex connectors (like 'and', 'but', 'although', 'which') to join your main clauses.",
            tip: "Score Checklist: Correct grammar, punctuation (exactly one capital letter at the start, exactly one period at the end), and spell check. Keep it simple; copy-paste key clauses directly.",
          },
          {
            module: "Reading",
            title: "Fill in the Blanks Collocations",
            strategy: "PTE heavily tests collocations (words that naturally fit together). Memorize lists of common prepositional combinations and verb-noun patterns.",
            tip: "Examples: 'play a role in', 'conduct a study', 'wide range of options', 'highly recommended', 'crucial factor', 'significant impact'.",
          },
          {
            module: "Listening",
            title: "Write from Dictation Memory Tip",
            strategy: "This is the single highest-scoring item type. Listen to the sentence structure, visualize the meaning, and type it immediately. Write alternative spellings or extra words at the end if unsure.",
            tip: "PTE scoring registers matching words. If you are unsure whether a word was singular or plural (e.g. 'student' vs 'students'), write both! There is no negative marking for extra words.",
          },
        ].map((item, idx) => (
          <div key={idx} className="card-hover bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="text-2xs font-mono font-bold text-success uppercase bg-success/5 border border-success/10 px-2 py-0.5 rounded-full">
                {item.module}
              </span>
              <span className="text-xs font-semibold text-ink">{item.title}</span>
            </div>
            <p className="text-xs text-body leading-relaxed">
              <strong className="text-ink">Strategy: </strong>
              {item.strategy}
            </p>
            <div className="bg-canvas-soft-2 p-3 rounded-lg border border-hairline text-2xs text-mute leading-normal">
              {item.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

