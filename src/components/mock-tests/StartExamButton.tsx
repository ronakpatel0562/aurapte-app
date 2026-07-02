"use client";

import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { requestFullscreenOnNavigate } from "@/lib/fullscreen";

export default function StartExamButton({ href, label = "Start Exam" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      onClick={requestFullscreenOnNavigate}
      className="group/btn relative h-9 pl-3.5 pr-3 rounded-lg bg-primary text-on-primary font-semibold text-2xs flex items-center gap-1.5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
    >
      <Play className="w-2.5 h-2.5 fill-current shrink-0" />
      <span>{label}</span>
      <ArrowRight className="w-3 h-3 -mr-0.5 opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200" />
    </Link>
  );
}
