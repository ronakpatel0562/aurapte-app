"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, Loader2 } from "lucide-react";

interface PredictionFile {
  module: string;
  title: string;
  filename: string;
}

/** Badge tint per module — mirrors the module icon colors used on practice test cards. */
const MODULE_BADGE_TINT: Record<string, string> = {
  "This Month": "text-violet-deep bg-violet/10 border-violet/20",
  Speaking: "text-error-deep bg-error/10 border-error/20",
  Writing: "text-link-deep bg-link/10 border-link/20",
  Reading: "text-warning-deep bg-warning/10 border-warning/20",
  Listening: "text-cyan-deep bg-cyan/15 border-cyan/25",
};
const DEFAULT_BADGE_TINT = "text-success bg-success/5 border-success/10";

export default function PredictionFilesClient({ files }: { files: PredictionFile[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const openFile = (filename: string) => {
    setLoadingFile(filename);
    startTransition(() => {
      router.push(`/prediction-files/${filename}`);
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4">
      {files.map((item) => {
        const isLoading = isPending && loadingFile === item.filename;
        return (
          <button
            key={item.filename}
            type="button"
            onClick={() => openFile(item.filename)}
            disabled={isPending}
            className="card-hover text-left bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card space-y-4 block w-full disabled:opacity-60 disabled:cursor-wait"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span
                className={`text-2xs font-mono font-bold uppercase border px-2 py-0.5 rounded-full ${
                  MODULE_BADGE_TINT[item.module] ?? DEFAULT_BADGE_TINT
                }`}
              >
                {item.module}
              </span>
              <FileText className="w-4 h-4 text-mute" />
            </div>
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <div className="w-full h-9 px-4 bg-canvas-soft-2 border border-hairline hover:bg-canvas-soft text-ink font-medium text-xs rounded-md transition duration-150 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Opening…</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
