import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getActiveVersion } from "@/lib/services/pitch";
import { listReviews } from "@/lib/services/pitch-review";
import { listAttempts } from "@/lib/services/pitch-practice";
import { computePitchLiveReadiness } from "@/lib/pitch/pitch-live-readiness";
import { PitchLiveView, type PitchLiveEntry } from "@/components/dashboard/pitch/PitchLiveView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pitch.live" });
  return { title: t("pageTitle") };
}

export default async function DashboardPitchLivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, PitchLiveEntry> = Object.fromEntries(
    startups.map((startup) => {
      const activeVersion = getActiveVersion(startup.id);
      const reviews = listReviews(startup.id, activeVersion?.id);
      const attempts = listAttempts(startup.id, activeVersion?.id);
      const liveReadiness = computePitchLiveReadiness(activeVersion, reviews, attempts);
      const openCriticalFeedbackCount = reviews
        .flatMap((r) => r.comments)
        .filter((c) => c.type === "critical_issue" && c.status === "open").length;

      return [
        startup.id,
        {
          activeVersion,
          readiness: activeVersion?.readiness,
          liveReadiness,
          practiceAttemptCount: attempts.filter((a) => a.completedAt).length,
          openCriticalFeedbackCount,
        },
      ];
    }),
  );

  return <PitchLiveView dataByStartupId={dataByStartupId} />;
}
