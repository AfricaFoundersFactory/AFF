"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BellIcon } from "./icons";
import { EmptyState } from "./EmptyState";

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("dashboard.notifications");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("label")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-aff-muted transition-colors hover:bg-aff-bg2 hover:text-aff-text"
      >
        <BellIcon className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-20" aria-hidden="true" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-aff-line bg-aff-bg2 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <div className="mb-2 px-1 text-[12px] font-semibold tracking-[0.06em] text-aff-muted">
              {t("label").toUpperCase()}
            </div>
            <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
          </div>
        </>
      ) : null}
    </div>
  );
}
