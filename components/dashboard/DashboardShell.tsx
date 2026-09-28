"use client";

import { useState, type CSSProperties } from "react";
import { StartupProvider } from "./StartupContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";
import type { Startup } from "@/types/domain";
import type { SessionUser } from "@/lib/auth/session";

export function DashboardShell({
  startups,
  initialStartupId,
  user,
  children,
}: {
  startups: Startup[];
  initialStartupId: string;
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const contentStyle = {
    "--aff-sidebar-w": collapsed ? "80px" : "256px",
  } as CSSProperties;

  return (
    <StartupProvider startups={startups} initialStartupId={initialStartupId}>
      <div className="min-h-screen overflow-x-hidden bg-aff-bg text-aff-text">
        <DashboardSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="flex min-h-screen flex-col lg:pl-[var(--aff-sidebar-w)]" style={contentStyle}>
          <DashboardTopbar
            user={user}
            onOpenMobileNav={() => setMobileOpen(true)}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </StartupProvider>
  );
}
