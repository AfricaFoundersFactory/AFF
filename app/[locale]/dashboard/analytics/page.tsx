import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getFounderAnalytics } from "@/lib/services/analytics";
import { AnalyticsView } from "@/components/dashboard/analytics/AnalyticsView";
import type { AnalyticsRange, FounderAnalyticsSnapshot } from "@/types/analytics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.module" });
  return { title: t("analytics.title") };
}

export default async function DashboardAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { range: rawRange } = await searchParams;
  const range: AnalyticsRange = rawRange === "30D" || rawRange === "90D" ? rawRange : "ALL";

  const { startups } = await getWorkspaceContext();
  const nowIso = new Date().toISOString();

  const dataByStartupId: Record<string, FounderAnalyticsSnapshot> = Object.fromEntries(
    startups.map((startup) => [startup.id, getFounderAnalytics(startup.id, range, nowIso)]),
  );

  return <AnalyticsView dataByStartupId={dataByStartupId} range={range} />;
}
