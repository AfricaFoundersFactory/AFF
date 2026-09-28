import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getFinancialProfile, getFinancialSnapshot } from "@/lib/services/financials";
import { FinancialsView, type FinancialsPageEntry } from "@/components/dashboard/financials/FinancialsView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.financials" });
  return { title: t("pageTitle") };
}

export default async function DashboardFinancialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const nowIso = new Date().toISOString();

  const dataByStartupId: Record<string, FinancialsPageEntry> = Object.fromEntries(
    startups.map((startup) => {
      const profile = getFinancialProfile(startup.id, startup.twin.identity.preferredCurrency);
      const snapshot = getFinancialSnapshot(startup.id, nowIso);
      return [startup.id, { profile, snapshot }];
    }),
  );

  return <FinancialsView dataByStartupId={dataByStartupId} />;
}
