"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Mic,
  PenTool,
  BookOpenCheck,
  Headphones,
  Lock,
  ChevronDown,
  ChevronRight,
  LogOut,
  Award,
  X,
  FileText,
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { planName, isPremiumPlan } from "@/lib/plans";
import ThemeToggle from "@/components/providers/ThemeToggle";

interface TaskTypeItem {
  name: string;
  href: string;
}

interface ModuleGroup {
  name: string;
  icon: React.ComponentType<any>;
  tasks: TaskTypeItem[];
}

const MODULES: ModuleGroup[] = [
  {
    name: "Speaking",
    icon: Mic,
    tasks: [
      { name: "Read Aloud", href: "/questions/speaking/read-aloud" },
      { name: "Repeat Sentence", href: "/questions/speaking/repeat-sentence" },
      { name: "Describe Image", href: "/questions/speaking/describe-image" },
      { name: "Responding to Situation", href: "/questions/speaking/responding-to-situation" },
      { name: "Answer Short Question", href: "/questions/speaking/answer-short-question" },
    ],
  },
  {
    name: "Writing",
    icon: PenTool,
    tasks: [
      { name: "Summarize Written Text", href: "/questions/writing/summarize-written-text" },
      { name: "Write an Email", href: "/questions/writing/write-an-email" },
    ],
  },
  {
    name: "Reading",
    icon: BookOpenCheck,
    tasks: [
      { name: "R&W Fill in the Blanks", href: "/questions/reading/rw-fill-in-the-blanks" },
      { name: "Multiple Choice – Multiple", href: "/questions/reading/multiple-choice-multiple" },
      { name: "Re-order Paragraphs", href: "/questions/reading/reorder-paragraphs" },
      { name: "Reading Fill in the Blanks", href: "/questions/reading/reading-fill-in-the-blanks" },
      { name: "Multiple Choice – Single", href: "/questions/reading/multiple-choice-single" },
    ],
  },
  {
    name: "Listening",
    icon: Headphones,
    tasks: [
      { name: "Summarize Spoken Text", href: "/questions/listening/summarize-spoken-text" },
      { name: "Multiple Choice – Multiple", href: "/questions/listening/multiple-choice-multiple" },
      { name: "Fill in the Blanks", href: "/questions/listening/fill-in-the-blanks" },
      { name: "Multiple Choice – Single", href: "/questions/listening/multiple-choice-single" },
      { name: "Select Missing Word", href: "/questions/listening/select-missing-word" },
      { name: "Highlight Incorrect Words", href: "/questions/listening/highlight-incorrect-words" },
      { name: "Write from Dictation", href: "/questions/listening/write-from-dictation" },
    ],
  },
];

/**
 * Full-screen slide-in nav drawer used on phones (where the desktop Sidebar
 * is hidden). The Sidebar component is no longer the only source of nav —
 * this drawer reuses the same module list so both surfaces stay in sync.
 *
 * Opens via the menu button injected into BottomNav; closes on link click
 * or backdrop tap. Lock body scroll while open so a tap on a link doesn't
 * cause the page under the drawer to scroll.
 */
export default function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [plan, setPlan] = useState<string>("free");


  // Lock background scroll while open. Restore on close.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", user.id)
            .maybeSingle();
          if (data) setPlan(data.plan || "free");
        }
      } catch {}
    };
    loadPlan();
  }, []);



  const isPremium = isPremiumPlan(plan);

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-canvas border-r border-hairline shadow-vercel-modal flex flex-col transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="h-16 border-b border-hairline flex items-center justify-between px-5">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800 overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-gradient-to-tr from-gradient-develop-start to-gradient-preview-end opacity-40 blur-[1px]" />
              <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-zinc-950" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">
              Aura<span className="bg-gradient-to-r from-gradient-develop-start to-gradient-preview-end bg-clip-text text-transparent">PTE</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-md flex items-center justify-center text-mute hover:bg-canvas-soft-2 hover:text-ink transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
              pathname === "/dashboard" ? "bg-canvas-soft-2 text-ink font-semibold" : "text-body hover:bg-canvas-soft hover:text-ink"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          <div>
            <div className="flex items-center gap-2 px-3 mb-1 text-2xs font-semibold text-mute uppercase tracking-widest">
              <BookOpen className="w-3.5 h-3.5" />
              Question Bank
            </div>
            <div className="space-y-0.5">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                const moduleHref = `/questions/${mod.name.toLowerCase()}`;
                const isModuleActive = pathname.startsWith(moduleHref);
                return (
                  <div key={mod.name}>
                    <div
                      className={`flex items-center gap-1 rounded-md transition ${
                        isModuleActive ? "bg-canvas-soft" : ""
                      }`}
                    >
                      <Link
                        href={moduleHref}
                        onClick={onClose}
                        className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition ${
                          isModuleActive ? "text-primary" : "text-body hover:text-ink"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {mod.name}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-hairline space-y-0.5">
            <Link
              href="/practice-tests"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-body hover:bg-canvas-soft hover:text-ink transition"
            >
              <span className="flex items-center gap-3">
                <BookOpenCheck className="w-4 h-4" />
                Practice Test
              </span>
              {!isPremium && (
                <span className="text-[10px] bg-canvas-soft-2 border border-hairline px-1.5 py-0.5 rounded font-mono text-mute uppercase">
                  10 tests
                </span>
              )}
            </Link>
            <Link
              href="/mock-tests"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-body hover:bg-canvas-soft hover:text-ink transition"
            >
              <span className="flex items-center gap-3">
                <Award className="w-4 h-4" />
                Mock Test
              </span>
              {!isPremium && (
                <span className="text-[10px] bg-canvas-soft-2 border border-hairline px-1.5 py-0.5 rounded font-mono text-mute uppercase">
                  5 tests
                </span>
              )}
            </Link>
            <Link
              href="/specialised-tips"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-body hover:bg-canvas-soft hover:text-ink transition"
            >
              <span className="flex items-center gap-3">
                <PenTool className="w-4 h-4" />
                Specialised Tips
              </span>
            </Link>
            <Link
              href="/prediction-files"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-body hover:bg-canvas-soft hover:text-ink transition"
            >
              <span className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                Prediction Files
              </span>
            </Link>
            <Link
              href="/billing"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-body hover:bg-canvas-soft hover:text-ink transition"
            >
              <span className="flex items-center gap-3">
                <Award className="w-4 h-4" />
                Plans &amp; Billing
              </span>
              <span className="text-[10px] bg-canvas-soft-2 border border-hairline px-1.5 py-0.5 rounded font-mono text-mute">
                {planName(plan)}
              </span>
            </Link>
          </div>

          {/* Theme + plan info at the bottom of the drawer */}
          <div className="pt-3 border-t border-hairline space-y-3">
            <div>
              <div className="text-2xs font-semibold text-mute uppercase tracking-widest mb-2 px-3">
                Appearance
              </div>
              <div className="px-3">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-hairline">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-error hover:bg-error-soft rounded-md transition"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
