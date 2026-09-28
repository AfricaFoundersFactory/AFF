"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Startup } from "@/types/domain";

type StartupContextValue = {
  startups: Startup[];
  activeStartup: Startup;
  setActiveStartupId: (id: string) => void;
};

const StartupContext = createContext<StartupContextValue | null>(null);

export function StartupProvider({
  startups,
  initialStartupId,
  children,
}: {
  startups: Startup[];
  initialStartupId: string;
  children: React.ReactNode;
}) {
  const [activeStartupId, setActiveStartupId] = useState(initialStartupId);

  const value = useMemo<StartupContextValue>(() => {
    const activeStartup =
      startups.find((startup) => startup.id === activeStartupId) ?? startups[0];
    return { startups, activeStartup, setActiveStartupId };
  }, [startups, activeStartupId]);

  return <StartupContext.Provider value={value}>{children}</StartupContext.Provider>;
}

export function useStartup() {
  const context = useContext(StartupContext);
  if (!context) {
    throw new Error("useStartup must be used within a StartupProvider");
  }
  return context;
}
