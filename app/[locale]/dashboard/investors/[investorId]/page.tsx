import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getSession } from "@/lib/auth/session";
import { getInvestor } from "@/lib/services/investors";
import { listShortlist } from "@/lib/services/investor-shortlist";
import { listPipeline, listRounds } from "@/lib/services/fundraising-pipeline";
import { listInteractions } from "@/lib/services/investor-interactions";
import { listIntroductionRequests } from "@/lib/services/introduction-requests";
import { listShares } from "@/lib/services/data-room-shares";
import { getFinancialProfile } from "@/lib/services/financials";
import { getCompletion, getDataRoom } from "@/lib/services/data-room";
import { getActiveVersion } from "@/lib/services/pitch";
import { getLatestAssessment } from "@/lib/services/readiness";
import { computeProfileCompletion } from "@/lib/services/profile-completion";
import { buildStartupMatchFacts } from "@/lib/investors/thesis";
import { computeInvestorMatch } from "@/lib/investors/matching";
import { computeIntroductionReadiness } from "@/lib/investors/readiness-checklist";
import { InvestorProfileView, type InvestorProfileStartupData } from "@/components/dashboard/investors/InvestorProfileView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; investorId: string }>;
}): Promise<Metadata> {
  const { locale, investorId } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.investors" });
  const record = getInvestor(investorId);
  return { title: record ? `${record.organization.name} — ${t("pageTitle")}` : t("pageTitle") };
}

export default async function DashboardInvestorProfilePage({
  params,
}: {
  params: Promise<{ locale: string; investorId: string }>;
}) {
  const { locale, investorId } = await params;
  setRequestLocale(locale as Locale);

  const record = getInvestor(investorId);
  if (!record) notFound();

  const { startups } = await getWorkspaceContext();
  const session = await getSession();
  const founderId = session?.user.id ?? "unknown-founder";

  const dataByStartupId: Record<string, InvestorProfileStartupData> = {};
  for (const startup of startups) {
    const financialProfile = getFinancialProfile(startup.id);
    const fundingRequirement = financialProfile.fundingRequirement;
    const facts = buildStartupMatchFacts(startup.id, startup.twin, fundingRequirement);
    const match = computeInvestorMatch(facts, record);

    const completion = computeProfileCompletion(startup.twin);
    const dataRoomCompletion = getCompletion(startup.id);
    const activeVersion = getActiveVersion(startup.id);
    const latestAssessment = getLatestAssessment(startup.id);
    const hasFinancialData = financialProfile.periods.length > 0 || financialProfile.cashPosition !== undefined;

    const readiness = computeIntroductionReadiness({
      profileCompletionPct: completion.overallPct,
      hasPitch: Boolean(activeVersion),
      hasFundingRequirement: Boolean(fundingRequirement),
      dataRoomCompletionPct: dataRoomCompletion.completionPct,
      hasFinancialData,
      hasReadinessAssessment: Boolean(latestAssessment),
    });

    dataByStartupId[startup.id] = {
      match,
      shortlistEntry: listShortlist(startup.id).find((s) => s.investorId === investorId),
      pipelineEntry: listPipeline(startup.id).find((p) => p.investorId === investorId),
      rounds: listRounds(startup.id),
      interactions: listInteractions(startup.id, investorId),
      introRequests: listIntroductionRequests(startup.id).filter((r) => r.investorId === investorId),
      shares: listShares(startup.id).filter((s) => s.investorId === investorId),
      documents: getDataRoom(startup.id).documents.map((d) => ({ id: d.id, title: d.title, category: d.category })),
      readiness,
    };
  }

  return <InvestorProfileView founderId={founderId} record={record} dataByStartupId={dataByStartupId} />;
}
