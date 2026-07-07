"use client";

import { useRef, useState } from "react";
import { FileDown, FileText } from "lucide-react";

interface PredictionFile {
  module: string;
  title: string;
  filename: string;
}

const STATUS_MESSAGES: Record<number, string> = {
  401: "Your session has expired — please log in again.",
  402: "Your plan is inactive. Renew your plan on the Billing page to download prediction files.",
  404: "That file could not be found.",
};

function errorMessageFor(status: number): string {
  return STATUS_MESSAGES[status] ?? "Download failed. Please try again.";
}

async function downloadFile(filename: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/prediction-files/${filename}`);
    if (!res.ok) {
      return errorMessageFor(res.status);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return null;
  } catch {
    return "Download failed — check your connection and try again.";
  }
}

export default function PredictionFilesClient({ files }: { files: PredictionFile[] }) {
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = (message: string) => {
    setError(message);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setError(null), 4000);
  };

  const handleSingleDownload = async (filename: string) => {
    const err = await downloadFile(filename);
    if (err) showError(err);
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    for (const file of files) {
      const err = await downloadFile(file.filename);
      if (err) {
        showError(err);
        break;
      }
    }
    setDownloadingAll(false);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div />
        <button
          onClick={handleDownloadAll}
          disabled={downloadingAll}
          className="h-10 px-5 bg-gradient-to-r from-gradient-brand-start to-gradient-brand-end text-white hover:opacity-95 font-medium text-sm rounded-md shadow-md transition duration-150 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4" />
          <span>{downloadingAll ? "Downloading…" : "Download All Files"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4">
        {files.map((item) => (
          <div
            key={item.filename}
            className="card-hover bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card space-y-4"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="text-2xs font-mono font-bold text-success uppercase bg-success/5 border border-success/10 px-2 py-0.5 rounded-full">
                {item.module}
              </span>
              <FileText className="w-4 h-4 text-mute" />
            </div>
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <button
              onClick={() => handleSingleDownload(item.filename)}
              className="w-full h-9 px-4 bg-canvas-soft-2 border border-hairline hover:bg-canvas-soft text-ink font-medium text-xs rounded-md transition duration-150 flex items-center justify-center gap-2"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-lg bg-zinc-950 text-white text-sm font-medium shadow-vercel-card border border-zinc-800 max-w-md text-center">
          {error}
        </div>
      )}
    </>
  );
}
