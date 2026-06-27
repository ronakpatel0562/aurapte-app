"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";

interface ModelAnswerProps {
  answer: React.ReactNode;
  title?: string;
  defaultOpen?: boolean;
}

export default function ModelAnswer({
  answer,
  title = "Model Answer",
  defaultOpen = false,
}: ModelAnswerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-hairline rounded-lg bg-canvas overflow-hidden shadow-vercel-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-canvas-soft transition text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 text-body-sm-strong font-semibold text-ink">
          <Eye className="w-4.5 h-4.5 text-mute" />
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-mute" />
        ) : (
          <ChevronDown className="w-4 h-4 text-mute" />
        )}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-hairline bg-canvas-soft-2 font-geist text-body-md text-ink leading-loose whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
