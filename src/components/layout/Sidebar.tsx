"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

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
      {
        name: "Responding to Situation",
        href: "/questions/speaking/responding-to-situation",
      },
      {
        name: "Answer Short Question",
        href: "/questions/speaking/answer-short-question",
      },
    ],
  },
  {
    name: "Writing",
    icon: PenTool,
    tasks: [
      {
        name: "Summarize Written Text",
        href: "/questions/writing/summarize-written-text",
      },
      { name: "Write an Email", href: "/questions/writing/write-an-email" },
    ],
  },
  {
    name: "Reading",
    icon: BookOpenCheck,
    tasks: [
      {
        name: "R&W Fill in the Blanks",
        href: "/questions/reading/rw-fill-in-the-blanks",
      },
      {
        name: "Multiple Choice – Multiple",
        href: "/questions/reading/multiple-choice-multiple",
      },
      {
        name: "Re-order Paragraphs",
        href: "/questions/reading/reorder-paragraphs",
      },
      {
        name: "Reading Fill in the Blanks",
        href: "/questions/reading/reading-fill-in-the-blanks",
      },
      {
        name: "Multiple Choice – Single",
        href: "/questions/reading/multiple-choice-single",
      },
    ],
  },
  {
    name: "Listening",
    icon: Headphones,
    tasks: [
      {
        name: "Summarize Spoken Text",
        href: "/questions/listening/summarize-spoken-text",
      },
      {
        name: "Multiple Choice – Multiple",
        href: "/questions/listening/multiple-choice-multiple",
      },
      {
        name: "Fill in the Blanks",
        href: "/questions/listening/fill-in-the-blanks",
      },
      {
        name: "Multiple Choice – Single",
        href: "/questions/listening/multiple-choice-single",
      },
      {
        name: "Select Missing Word",
        href: "/questions/listening/select-missing-word",
      },
      {
        name: "Highlight Incorrect Words",
        href: "/questions/listening/highlight-incorrect-words",
      },
      {
        name: "Write from Dictation",
        href: "/questions/listening/write-from-dictation",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    Speaking: pathname.includes("/speaking/"),
    Writing: pathname.includes("/writing/"),
    Reading: pathname.includes("/reading/"),
    Listening: pathname.includes("/listening/"),
  });
  const [questionBankOpen, setQuestionBankOpen] = useState(true);
  const [plan, setPlan] = useState<string>("free");

  const loadPlan = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .maybeSingle();

        if (dbProfile) {
          setPlan(dbProfile.plan || "free");
        }
      }
    } catch (err) {
      console.error("Failed to load user plan in sidebar:", err);
    }
  };

  useEffect(() => {
    loadPlan();

    // Listen for custom plan change events from the header switcher
    const handlePlanChange = () => {
      loadPlan();
    };
    window.addEventListener("planChanged", handlePlanChange);
    return () => {
      window.removeEventListener("planChanged", handlePlanChange);
    };
  }, []);

  const isPremium = plan === "premium";

  const toggleModule = (moduleName: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-64 border-r border-hairline bg-canvas flex flex-col h-screen sticky top-0 overflow-y-auto select-none font-geist">
      {/* Brand Header */}
      <div className="h-16 border-b border-hairline flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800 overflow-hidden shadow-md transition group-hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-tr from-gradient-develop-start to-gradient-preview-end opacity-40 blur-[1px]" />
            <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-white shadow-inner flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-zinc-950" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-ink">
            Aura<span className="bg-gradient-to-r from-gradient-develop-start to-gradient-preview-end bg-clip-text text-transparent font-extrabold">PTE</span>
          </span>
        </Link>
      </div>

      {/* Nav Content */}
      <nav className="flex-1 px-4 py-6 space-y-6">
        {/* Core Links */}
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
              pathname === "/dashboard"
                ? "bg-canvas-soft-2 text-ink font-semibold"
                : "text-body hover:bg-canvas-soft hover:text-ink"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          {/* Question Bank Parent */}
          <div>
            <button
              onClick={() => setQuestionBankOpen(!questionBankOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-body hover:bg-canvas-soft hover:text-ink rounded-md transition"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" />
                <span>Question Bank</span>
              </div>
              {questionBankOpen ? (
                <ChevronDown className="w-4 h-4 text-mute" />
              ) : (
                <ChevronRight className="w-4 h-4 text-mute" />
              )}
            </button>

            {/* Modules Nested Tree */}
            {questionBankOpen && (
              <div className="pl-4 mt-1 space-y-1">
                {MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = pathname.startsWith(`/questions/${mod.name.toLowerCase()}`);
                  return (
                    <Link
                      key={mod.name}
                      href={`/questions/${mod.name.toLowerCase()}`}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition ${
                        isActive
                          ? "text-primary bg-canvas-soft font-semibold"
                          : "text-mute hover:text-ink"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{mod.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add-on Sections */}
        <div className="space-y-1 pt-4 border-t border-hairline">
          <p className="px-3 text-2xs font-semibold text-mute uppercase tracking-widest mb-2">
            Add-ons
          </p>
          
          {/* Practice Test */}
          <Link
            href="/practice-tests"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition ${
              pathname === "/practice-tests"
                ? "bg-canvas-soft-2 text-ink font-semibold"
                : "text-body hover:bg-canvas-soft hover:text-ink"
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpenCheck className="w-4 h-4" />
              <span>Practice Test</span>
            </div>
            {!isPremium && (
              <span className="text-[10px] bg-canvas-soft-2 border border-hairline px-1.5 py-0.5 rounded font-mono text-mute font-medium uppercase scale-90">
                10 Free
              </span>
            )}
          </Link>

          {/* Mock Test */}
          <Link
            href="/mock-tests"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition ${
              pathname === "/mock-tests"
                ? "bg-canvas-soft-2 text-ink font-semibold"
                : "text-body hover:bg-canvas-soft hover:text-ink"
            }`}
          >
            <div className="flex items-center gap-3">
              <Award className="w-4 h-4" />
              <span>Mock Test</span>
            </div>
            {!isPremium && (
              <span className="text-[10px] bg-canvas-soft-2 border border-hairline px-1.5 py-0.5 rounded font-mono text-mute font-medium uppercase scale-90">
                5 Free
              </span>
            )}
          </Link>

          {/* Specialised Tips */}
          <Link
            href="/specialised-tips"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition ${
              pathname === "/specialised-tips"
                ? "bg-canvas-soft-2 text-ink font-semibold"
                : "text-body hover:bg-canvas-soft hover:text-ink"
            }`}
          >
            <div className="flex items-center gap-3">
              <PenTool className="w-4 h-4" />
              <span>Specialised Tips</span>
            </div>
            {!isPremium ? (
              <Lock className="w-3.5 h-3.5 text-mute" />
            ) : (
              <span className="text-[10px] bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded font-mono font-medium uppercase scale-90">
                PDF
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-hairline">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-error hover:bg-error-soft hover:text-error-deep rounded-md transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
