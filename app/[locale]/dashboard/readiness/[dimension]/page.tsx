import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getLatestAssessment } from "@/lib/services/readiness";
import { DimensionDrillDownView } from "@/components/dashboard/readiness/DimensionDrillDownView";
import { DIMENSION_KEYS, type DimensionKey } from "@/types/readiness-engine";
import type { DimensionResult } from "@/types/readiness-engine";

function isDimensionKey(value: string): value is DimensionKey {
  return (DIMENSION_KEYS as string[]).includes(value);
}

export function generateStaticParams() {
  return DIMENSION_KEYS.map((dimension) => ({ dimension }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; dimension: string }>;
}): Promise<Metadata> {
  const { locale, dimension } = await params;
  if (!isDimensionKey(dimension)) return {};
  const t = await getTranslations({ locale, namespace: "dashboard.readiness.dimensions" });
  return { title: t(`${dimension}.label`) };
}

export default async function DashboardReadinessDimensionPage({
  params,
}: {
  params: Promise<{ locale: string; dimension: string }>;
}) {
  const { locale, dimension } = await params;
  setRequestLocale(locale as Locale);

  if (!isDimensionKey(dimension)) {
    notFound();
  }

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, DimensionResult | undefined> = Object.fromEntries(
    startups.map((startup) => {
      const assessment = getLatestAssessment(startup.id);
      return [startup.id, assessment?.dimensions.find((d) => d.dimension === dimension)];
    }),
  );

  return <DimensionDrillDownView dimension={dimension} dataByStartupId={dataByStartupId} />;
}
