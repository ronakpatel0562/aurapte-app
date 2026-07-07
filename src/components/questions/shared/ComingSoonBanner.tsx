import React from "react";
import { AlertCircle } from "lucide-react";

interface ComingSoonBannerProps {
  message?: string;
}

export default function ComingSoonBanner({
  message = "Answer evaluation and scoring for this task type are coming soon.",
}: ComingSoonBannerProps) {
  return (
    <div className="bg-canvas border border-warning/30 rounded-lg p-4 flex items-start gap-3 shadow-vercel-card">
      <AlertCircle className="w-5 h-5 text-warning-deep mt-0.5 shrink-0" />
      <div className="space-y-1">
        <h4 className="text-body-sm-strong font-semibold text-ink">
          Evaluation Coming Soon
        </h4>
        <p className="text-xs text-mute leading-relaxed">
          {message} You can practice typing or speaking, but automatic scoring
          is currently mocked or locked.
        </p>
      </div>
    </div>
  );
}
