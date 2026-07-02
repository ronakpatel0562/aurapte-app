"use client";

import React from "react";
import { Volume2 } from "lucide-react";

/**
 * Plain, on-demand audio player for the evaluation screen. Unlike the
 * in-exam AudioPromptBox (3s prep + single autoplay — see
 * [[project_reuse_audio_component]]), review lets the student replay the
 * recording freely, so this is just native <audio controls>.
 */
export default function EvalAudio({ audioUrl }: { audioUrl?: string }) {
  if (!audioUrl) return null;
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#5E94B5]/40 bg-[#5E94B5]/10 px-4 py-3">
      <Volume2 className="w-4 h-4 text-[#5E94B5] shrink-0" />
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls src={audioUrl} className="w-full h-9" />
    </div>
  );
}
