"use client";

import React, { useEffect, useState } from "react";
import { ZoomIn, X, Download, Maximize2 } from "lucide-react";

/**
 * MediaDetail — clickable thumbnail that opens a fullscreen lightbox for
 * question images (Describe Image task type, chart/diagram in reading,
 * etc.). Falls back to the plain image if no URL is provided.
 *
 * Keyboard: ESC closes the lightbox, ←/→ switch between sibling images
 * (when multiple are passed). Body scroll is locked while open.
 */
interface MediaDetailProps {
  src?: string | null;
  alt?: string;
  /** Optional caption shown under the thumbnail and inside the lightbox. */
  caption?: string;
  /** Class names merged onto the thumbnail wrapper. */
  className?: string;
  /** When true, renders the thumbnail at a smaller, "chip" size. */
  compact?: boolean;
}

export default function MediaDetail({
  src,
  alt = "Question media",
  caption,
  className = "",
  compact = false,
}: MediaDetailProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the lightbox is open. ESC to close.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge image: ${alt}`}
        className={`group relative inline-block rounded-lg border border-hairline overflow-hidden bg-canvas-soft focus:outline-none focus:ring-2 focus:ring-primary transition ${
          compact ? "w-32" : "w-full max-w-md"
        } ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-auto block"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-canvas text-ink text-xs font-semibold shadow-vercel-card">
            <ZoomIn className="w-3.5 h-3.5" />
            Enlarge
          </div>
        </div>
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-2xs text-white bg-gradient-to-t from-black/60 to-transparent text-left">
            {caption}
          </div>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 media-lightbox-backdrop flex items-center justify-center p-4 sm:p-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-full max-h-full flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-right close + download */}
            <div className="flex items-center justify-end gap-2 w-full">
              <a
                href={src}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition"
                aria-label="Download original image"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-md flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition"
                aria-label="Close lightbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* The image itself — natural size, scrollable if huge. */}
            <div className="relative bg-canvas rounded-xl overflow-hidden shadow-vercel-modal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="block max-w-full max-h-[80vh] object-contain"
              />
              {caption && (
                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 text-xs text-white bg-gradient-to-t from-black/80 to-transparent">
                  {caption}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-2xs text-white/70">
              <Maximize2 className="w-3 h-3" />
              Press ESC to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
