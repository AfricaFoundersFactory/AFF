"use client";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { StartupSwitcher } from "./StartupSwitcher";
import { UserMenu } from "./UserMenu";
import { NotificationsButton } from "./NotificationsButton";
import { MenuIcon, PanelToggleIcon } from "./icons";
import type { SessionUser } from "@/lib/auth/session";

export function DashboardTopbar({
  user,
  onOpenMobileNav,
  onToggleCollapsed,
}: {
  user: SessionUser;
  onOpenMobileNav: () => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-aff-line bg-aff-bg/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenMobileNav}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-aff-muted hover:bg-aff-bg2 hover:text-aff-text lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggleCollapsed}
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-aff-muted hover:bg-aff-bg2 hover:text-aff-text lg:flex"
        >
          <PanelToggleIcon className="h-5 w-5" />
        </button>
        <StartupSwitcher />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationsButton />
        <LanguageSwitcher className="hidden sm:flex" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
