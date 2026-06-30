"use client";

import React, { useEffect, useState } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/auth/actions";
import { PLANS, planName, type PlanId } from "@/lib/plans";

interface UserProfile {
  fullName: string;
  email: string;
  plan: PlanId;
}

export default function Header() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("full_name, plan")
            .eq("id", user.id)
            .maybeSingle();

          setProfile({
            fullName:
              dbProfile?.full_name ||
              user.user_metadata?.full_name ||
              "Student",
            email: user.email || "",
            plan: (dbProfile?.plan as PlanId) || "free",
          });
        }
      } catch (err) {
        console.error("Failed to load user profile in header:", err);
      }
    };
    loadProfile();

    const onChange = () => loadProfile();
    window.addEventListener("planChanged", onChange);
    return () => window.removeEventListener("planChanged", onChange);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const planDef = PLANS[profile?.plan ?? "free"];
  const isPremium = profile?.plan === "premium";

  return (
    <header className="h-16 border-b border-hairline bg-canvas flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 backdrop-blur-md bg-canvas/85">
      {/* Greeting (truncated on small screens) */}
      <div className="min-w-0">
        {profile ? (
          <h2 className="text-body-sm-strong text-body truncate">
            Welcome back,{" "}
            <span className="text-ink font-semibold">{profile.fullName}</span>
          </h2>
        ) : (
          <div className="w-36 h-4 bg-canvas-soft-2 animate-pulse rounded" />
        )}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {profile ? (
          <>
            {/* Plan badge — pill showing the friendly name. Premium gets a
                subtle gradient accent; free stays neutral. */}
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-mono font-semibold uppercase tracking-wider border ${
                isPremium
                  ? "text-on-primary bg-gradient-to-r from-gradient-preview-start to-gradient-preview-end border-transparent shadow-sm"
                  : "text-body bg-canvas-soft-2 border-hairline"
              }`}
              title={planDef.tagline}
            >
              <span>{planDef.name}</span>
            </div>

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 group"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div
                  className={`w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center shadow-vercel-card transition ${
                    isPremium
                      ? "bg-gradient-to-tr from-gradient-preview-start to-gradient-preview-end text-white"
                      : "bg-primary text-on-primary"
                  }`}
                >
                  {getInitials(profile.fullName)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-mute group-hover:text-ink transition" />
              </button>

              {menuOpen && (
                <>
                  {/* Click-away overlay */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-hairline bg-canvas shadow-vercel-popover z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-hairline">
                      <div className="text-xs text-mute font-mono uppercase tracking-wider">
                        Signed in as
                      </div>
                      <div className="text-sm font-semibold text-ink truncate">
                        {profile.email}
                      </div>
                    </div>

                    {/* Plan switcher (dev convenience — same as before but
                        using the friendly plan names) */}
                    <div className="px-4 py-3 border-b border-hairline">
                      <div className="text-xs text-mute font-mono uppercase tracking-wider mb-2">
                        Switch plan
                      </div>
                      <select
                        value={profile.plan}
                        onChange={async (e) => {
                          const newPlan = e.target.value as PlanId;
                          try {
                            const supabase = createClient();
                            const {
                              data: { user },
                            } = await supabase.auth.getUser();
                            if (user) {
                              const { error } = await supabase
                                .from("profiles")
                                .update({ plan: newPlan })
                                .eq("id", user.id);
                              if (!error) {
                                setProfile((p) => (p ? { ...p, plan: newPlan } : p));
                                window.dispatchEvent(new Event("planChanged"));
                              } else {
                                console.error("Plan update error:", error.message);
                              }
                            }
                          } catch (err) {
                            console.error("Failed to switch plan:", err);
                          }
                        }}
                        className="w-full text-xs font-medium bg-canvas-soft-2 border border-hairline rounded-md px-2 py-1.5 focus:outline-none cursor-pointer hover:border-hairline-strong transition"
                      >
                        {(Object.keys(PLANS) as PlanId[]).map((id) => (
                          <option key={id} value={id}>
                            {planName(id)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-error hover:bg-error-soft transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-6 bg-canvas-soft-2 animate-pulse rounded-full" />
            <div className="w-8 h-8 bg-canvas-soft-2 animate-pulse rounded-full" />
          </>
        )}
      </div>
    </header>
  );
}
