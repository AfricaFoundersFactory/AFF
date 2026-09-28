import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getActiveVersion } from "@/lib/services/pitch";
import { listReviews } from "@/lib/services/pitch-review";
import { PitchReviewView, type PitchReviewEntry } from "@/components/dashboard/pitch/PitchReviewView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pitch.review" });
  return { title: t("pageTitle") };
}

export default async function DashboardPitchReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, PitchReviewEntry> = Object.fromEntries(
    startups.map((startup) => {
      const activeVersion = getActiveVersion(startup.id);
      return [startup.id, { reviews: listReviews(startup.id, activeVersion?.id), sections: activeVersion?.sections ?? [] }];
    }),
  );

  return <PitchReviewView dataByStartupId={dataByStartupId} />;
}
