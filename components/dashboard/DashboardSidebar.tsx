"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  dashboardNavGroups,
  dashboardBottomNavItems,
} from "@/lib/dashboard/navigation";

function NavRow({
  href,
  label,
  collapsed,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  collapsed: boolean;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block truncate rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors",
        active
          ? "bg-aff-accent-soft text-aff-text"
          : "text-aff-muted hover:bg-aff-bg hover:text-aff-text",
      )}
    >
      {label}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const t = useTranslations("dashboard.nav");
  const tg = useTranslations("dashboard.navGroups");

  return (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-aff-line px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="truncate font-heading text-[13.5px] font-bold tracking-[0.06em] text-aff-text no-underline"
        >
          {collapsed ? "AFF" : "AFRICA FOUNDERS FACTORY"}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {dashboardNavGroups.map((group) => (
          <div key={group.key} className="mb-5">
            {!collapsed ? (
              <div className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.12em] text-aff-muted">
                {tg(group.key)}
              </div>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavRow
                  key={item.href}
                  href={item.href}
                  label={t(item.key)}
                  collapsed={collapsed}
                  active={pathname === item.href}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-aff-line px-3 py-3">
        {dashboardBottomNavItems.map((item) => (
          <NavRow
            key={item.href}
            href={item.href}
            label={t(item.key)}
            collapsed={collapsed}
            active={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </>
  );
}

export function DashboardSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-aff-line bg-aff-bg2 transition-[width] duration-200 lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} pathname={pathname} onNavigate={() => {}} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            aria-hidden="true"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 z-10 flex w-72 flex-col border-r border-aff-line bg-aff-bg2">
            <SidebarContent collapsed={false} pathname={pathname} onNavigate={onCloseMobile} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
