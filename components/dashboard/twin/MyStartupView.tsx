"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { SectionTabs, ProfileCompletionBar } from "./shared";
import { OverviewTab } from "./OverviewTab";
import { TeamTab } from "./TeamTab";
import { ProductTab } from "./ProductTab";
import { MarketTab } from "./MarketTab";
import { BusinessTab } from "./BusinessTab";
import { TractionTab } from "./TractionTab";
import { FinancialsTab } from "./FinancialsTab";
import { FundingTab } from "./FundingTab";
import { ImpactTab } from "./ImpactTab";
import { GoalsRisksTab } from "./GoalsRisksTab";
import { MilestonesTab } from "./MilestonesTab";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import type { StartupDigitalTwin } from "@/types/digital-twin";
import type { ProfileCompletion } from "@/types/profile-completion";

export type MyStartupEntry = { twin: StartupDigitalTwin; completion: ProfileCompletion };

const TAB_KEYS = [
  "overview",
  "team",
  "product",
  "market",
  "business",
  "traction",
  "financials",
  "funding",
  "impact",
  "goalsRisks",
  "milestones",
] as const;

export function MyStartupView({ dataByStartupId }: { dataByStartupId: Record<string, MyStartupEntry> }) {
  const { activeStartup } = useStartup();
  const t = useTranslations("dashboard.myStartup");
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TAB_KEYS)[number]>("overview");

  const entry = dataByStartupId[activeStartup.id];

  const onSaved = () => router.refresh();

  if (!entry) {
    return <EmptyState title={t("common.notFoundTitle")} body={t("common.notFoundBody")} />;
  }

  const { twin, completion } = entry;
  const startupId = activeStartup.id;

  const tabs = TAB_KEYS.map((key) => ({ key, label: t(`tabs.${key}`) }));

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-aff-line bg-aff-bg2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="font-heading text-xl font-semibold text-aff-text sm:text-2xl">{twin.identity.name}</h1>
          <p className="mt-1 text-[13.5px] text-aff-muted">
            {[twin.identity.industry, twin.identity.country].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <ProfileCompletionBar pct={completion.overallPct} label={t("overview.completionLabel")} />
        </div>
      </div>

      {!twin.onboarding.completed ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-aff-line-strong bg-aff-bg2 px-5 py-4">
          <p className="text-[13.5px] text-aff-text">{t("resumeOnboarding")}</p>
          <ButtonLink href="/dashboard/startup/onboarding" className="px-4 py-2.5 text-[13px]">
            {t("continueOnboarding")}
          </ButtonLink>
        </div>
      ) : null}

      <SectionTabs tabs={tabs} active={tab} onChange={(key) => setTab(key as (typeof TAB_KEYS)[number])} />

      {tab === "overview" ? <OverviewTab startupId={startupId} twin={twin} completion={completion} onSaved={onSaved} /> : null}
      {tab === "team" ? <TeamTab startupId={startupId} founders={twin.founders} team={twin.team} onSaved={onSaved} /> : null}
      {tab === "product" ? <ProductTab startupId={startupId} product={twin.product} onSaved={onSaved} /> : null}
      {tab === "market" ? <MarketTab startupId={startupId} market={twin.market} onSaved={onSaved} /> : null}
      {tab === "business" ? <BusinessTab startupId={startupId} businessModel={twin.businessModel} onSaved={onSaved} /> : null}
      {tab === "traction" ? <TractionTab startupId={startupId} traction={twin.traction} onSaved={onSaved} /> : null}
      {tab === "financials" ? <FinancialsTab startupId={startupId} financials={twin.financials} onSaved={onSaved} /> : null}
      {tab === "funding" ? <FundingTab startupId={startupId} funding={twin.funding} onSaved={onSaved} /> : null}
      {tab === "impact" ? <ImpactTab startupId={startupId} impact={twin.impact} onSaved={onSaved} /> : null}
      {tab === "goalsRisks" ? <GoalsRisksTab startupId={startupId} goals={twin.goals} risks={twin.risks} onSaved={onSaved} /> : null}
      {tab === "milestones" ? <MilestonesTab startupId={startupId} milestones={twin.milestones} onSaved={onSaved} /> : null}
    </div>
  );
}
