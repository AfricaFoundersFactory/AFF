"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStartup } from "./StartupContext";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "./icons";

export function StartupSwitcher() {
  const { startups, activeStartup, setActiveStartupId } = useStartup();
  const [open, setOpen] = useState(false);
  const tStage = useTranslations("dashboard.stage");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-lg border border-aff-line px-3 py-2 text-left transition-colors hover:border-aff-line-strong"
      >
        <span className="flex flex-col leading-tight">
          <span className="max-w-[140px] truncate text-[13.5px] font-semibold text-aff-text sm:max-w-none">
            {activeStartup.twin.identity.name}
          </span>
          <span className="text-[11.5px] text-aff-muted">{tStage(activeStartup.twin.identity.stage)}</span>
        </span>
        <ChevronDownIcon className={cn("h-4 w-4 text-aff-muted transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-20" aria-hidden="true" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-aff-line bg-aff-bg2 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          >
            {startups.map((startup) => (
              <li key={startup.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={startup.id === activeStartup.id}
                  onClick={() => {
                    setActiveStartupId(startup.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors",
                    startup.id === activeStartup.id
                      ? "bg-aff-accent-soft text-aff-text"
                      : "text-aff-muted hover:bg-aff-bg hover:text-aff-text",
                  )}
                >
                  <div className="font-semibold">{startup.twin.identity.name}</div>
                  <div className="text-[11.5px] text-aff-muted">
                    {tStage(startup.twin.identity.stage)} · {startup.twin.identity.industry}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
