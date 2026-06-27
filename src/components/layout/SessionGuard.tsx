"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useHeartbeat } from "@/hooks/useHeartbeat";

interface SessionGuardProps {
  children: React.ReactNode;
}

export default function SessionGuard({ children }: SessionGuardProps) {
  const router = useRouter();
  const supabase = createClient();

  // Ping /api/heartbeat every 60s while the tab is visible. The endpoint
  // does the user_sessions DB check that previously lived in middleware,
  // where it was costing a round-trip on every navigation.
  useHeartbeat(true);

  useEffect(() => {
    const originalFetch = window.fetch;

    // Intercept client-side fetches for 401 session overwritten errors
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        try {
          const clonedResponse = response.clone();
          const json = await clonedResponse.json();
          if (json?.error === "SESSION_OVERWRITTEN") {
            window.dispatchEvent(new Event("session-overwritten"));
          }
        } catch (e) {
          // Response is not JSON, ignore
        }
      }

      return response;
    };

    // Handler when session is overwritten
    const handleSessionOverwritten = async () => {
      // 1. Attempt to save local draft answers & state
      const currentPath = window.location.pathname;
      if (currentPath.includes("/questions/")) {
        const pathSegments = currentPath.split("/");
        const questionId = pathSegments[pathSegments.length - 1];
        
        if (questionId && questionId !== "page") {
          const formState: Record<string, any> = {};
          
          // Gather values from textareas, inputs, and selected options on page
          const textareas = document.querySelectorAll("textarea");
          textareas.forEach((t) => {
            formState[t.id || t.name || "textarea"] = t.value;
          });

          const inputs = document.querySelectorAll("input[type='text']");
          inputs.forEach((i) => {
            const inputEl = i as HTMLInputElement;
            formState[inputEl.id || inputEl.name || "input"] = inputEl.value;
          });

          // Save timer if element is present
          const timerEl = document.querySelector("[data-testid='timer']");
          const timeRemaining = timerEl ? timerEl.textContent : null;

          localStorage.setItem(
            `aurapte_saved_state_${questionId}`,
            JSON.stringify({
              path: currentPath,
              formState,
              timeRemaining,
              timestamp: Date.now(),
            })
          );
        }
      }

      // 2. Sign out from Supabase client
      await supabase.auth.signOut();

      // 3. Clear session cookie manually
      document.cookie =
        "session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";

      // 4. Redirect to login with error search param
      router.push("/login?error=SESSION_OVERWRITTEN");
    };

    window.addEventListener("session-overwritten", handleSessionOverwritten);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("session-overwritten", handleSessionOverwritten);
    };
  }, [router, supabase]);

  return <>{children}</>;
}
