import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getCommandCenterData } from "@/lib/services/dashboard-data";
import { CommandCenterView } from "@/components/dashboard/CommandCenterView";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { CommandCenterData } from "@/lib/services/dashboard-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.nav" });
  return { title: t("commandCenter") };
}

export default async function DashboardCommandCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const session = await getSession();
  if (!session) {
    const t = await getTranslations({ locale, namespace: "dashboard.recentActivity" });
    return <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />;
  }

  const { startups } = await getWorkspaceContext();

  // Small, fixed number of startups per founder in this demo — fetching all
  // of them lets the StartupSwitcher actually change what's on screen. A
  // real API-backed version would instead fetch on demand when the active
  // startup changes.
  const entries = await Promise.all(
    startups.map(async (startup) => [startup.id, await getCommandCenterData(startup.id)] as const),
  );
  const dataByStartupId = Object.fromEntries(
    entries.filter((entry): entry is [string, CommandCenterData] => entry[1] !== undefined),
  );

  return <CommandCenterView user={session.user} dataByStartupId={dataByStartupId} />;
}
