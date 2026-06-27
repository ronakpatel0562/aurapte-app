"use client";

import React from "react";
import { useHeartbeat } from "@/hooks/useHeartbeat";

interface DashboardClientLayoutProps {
  children: React.ReactNode;
}

export default function DashboardClientLayout({
  children,
}: DashboardClientLayoutProps) {
  // Activate heartbeat checks
  useHeartbeat(true);

  return <>{children}</>;
}
