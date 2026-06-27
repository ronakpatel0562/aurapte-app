"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  fullName: string;
  email: string;
  plan: string;
}

export default function Header() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
            plan: dbProfile?.plan || "free",
          });
        }
      } catch (err) {
        console.error("Failed to load user profile in header:", err);
      }
    };
    loadProfile();
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-hairline bg-canvas flex items-center justify-between px-8 z-30 select-none">
      <div>
        {profile ? (
          <h2 className="text-body-sm-strong text-body">
            Welcome back,{" "}
            <span className="text-ink font-semibold">{profile.fullName}</span>
          </h2>
        ) : (
          <div className="w-36 h-4 bg-canvas-soft-2 animate-pulse rounded" />
        )}
      </div>

      <div className="flex items-center gap-3">
        {profile ? (
          <>
            <select
              value={profile.plan}
              onChange={async (e) => {
                const newPlan = e.target.value;
                try {
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    const { error } = await supabase
                      .from("profiles")
                      .update({ plan: newPlan })
                      .eq("id", user.id);
                    if (!error) {
                      setProfile(prev => prev ? { ...prev, plan: newPlan } : null);
                      window.dispatchEvent(new Event("planChanged"));
                      window.location.reload();
                    } else {
                      console.error("Plan update error:", error.message);
                    }
                  }
                } catch (err) {
                  console.error("Failed to switch plan:", err);
                }
              }}
              className="text-2xs font-semibold text-body font-mono uppercase bg-canvas-soft-2 border border-hairline px-2 py-1.5 rounded-md focus:outline-none cursor-pointer hover:border-hairline-strong transition"
            >
              <option value="free">Plan 1 (Trial)</option>
              <option value="premium">Plan 2 (Premium)</option>
            </select>
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-semibold text-xs flex items-center justify-center shadow-vercel-card">
              {getInitials(profile.fullName)}
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
