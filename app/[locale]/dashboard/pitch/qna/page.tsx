import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getWorkspace } from "@/lib/services/pitch";
import { listAnswers } from "@/lib/services/pitch-qna";
import { selectContextualQuestions } from "@/lib/pitch/qna-selector";
import { PitchQnaView, type PitchQnaEntry } from "@/components/dashboard/pitch/PitchQnaView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pitch.qna" });
  return { title: t("pageTitle") };
}

export default async function DashboardPitchQnaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, PitchQnaEntry> = Object.fromEntries(
    startups.map((startup) => {
      const workspace = getWorkspace(startup.id);
      const objective = workspace?.objective ?? "general";
      const questions = selectContextualQuestions(startup.twin, objective);
      return [startup.id, { questions, answers: listAnswers(startup.id) }];
    }),
  );

  return <PitchQnaView dataByStartupId={dataByStartupId} />;
}
