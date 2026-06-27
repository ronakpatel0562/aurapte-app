import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import SessionGuard from "@/components/layout/SessionGuard";
import DashboardClientLayout from "./DashboardClientLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // Single memoised auth check for the request. The layout and the page
  // both call this; React.cache ensures only one Supabase auth round-trip.
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SessionGuard>
      <DashboardClientLayout>
        <div className="flex min-h-screen bg-canvas-soft text-ink font-geist">
          {/* Sidebar - hidden on mobile */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
            <Header />
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto p-6 md:p-8">
                {children}
              </div>
            </main>
          </div>

          {/* Bottom Tabs - visible on mobile only */}
          <BottomNav />
        </div>
      </DashboardClientLayout>
    </SessionGuard>
  );
}
