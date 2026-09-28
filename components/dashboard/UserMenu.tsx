"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/session";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("dashboard.userMenu");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("openMenu")}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-aff-accent-soft text-[12.5px] font-semibold text-aff-accent"
      >
        {initials(user.name)}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-20" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-aff-line bg-aff-bg2 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          >
            <div className="border-b border-aff-line px-3 py-2.5">
              <div className="truncate text-[13.5px] font-semibold text-aff-text">{user.name}</div>
              <div className="truncate text-[12px] text-aff-muted">{user.email}</div>
            </div>
            <div className="flex flex-col py-1.5">
              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-[13.5px] text-aff-muted transition-colors hover:bg-aff-bg hover:text-aff-text",
                )}
              >
                {t("profile")}
              </Link>
              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[13.5px] text-aff-muted transition-colors hover:bg-aff-bg hover:text-aff-text"
              >
                {t("workspaceSettings")}
              </Link>
            </div>
            <div className="border-t border-aff-line pt-1.5">
              <Link
                href="/sign-in"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-[13.5px] text-aff-muted transition-colors hover:bg-aff-bg hover:text-aff-text"
              >
                {t("signOut")}
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
