"use client";

import { useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Button, ButtonLink } from "@/components/ui/Button";
import { createWorkspaceAction } from "@/lib/actions/pitch";
import type { PitchAudience, PitchObjective, PitchType, PitchVersion, PitchWorkspace } from "@/types/pitch";
import { useRouter } from "@/i18n/navigation";

export type PitchLabEntry = {
  workspace: PitchWorkspace | undefined;
  activeVersion: PitchVersion | undefined;
  requiredTotal: number;
  requiredComplete: number;
  unresolvedFeedback: number;
};

const OBJECTIVES: PitchObjective[] = [
  "fundraising",
  "customer",
  "partnership",
  "grant",
  "accelerator",
  "competition",
  "pitch_live",
  "general",
];
const AUDIENCES: PitchAudience[] = [
  "investors",
  "customers",
  "corporates",
  "government",
  "donors",
  "accelerators",
  "general_public",
];
const PITCH_TYPES: PitchType[] = ["elevator", "one_minute", "three_minute", "five_minute", "investor_deck", "custom"];

function SetupForm({ startupId }: { startupId: string }) {
  const t = useTranslations("dashboard.pitch");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [objective, setObjective] = useState<PitchObjective>("fundraising");
  const [audience, setAudience] = useState<PitchAudience>("investors");
  const [pitchType, setPitchType] = useState<PitchType>("investor_deck");

  const handleCreate = () => {
    startTransition(async () => {
      await createWorkspaceAction(startupId, { objective, audience, pitchType });
      router.refresh();
    });
  };

  return (
    <DashboardSection title={t("overview.setupTitle")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-[12.5px] text-aff-muted">
          {t("overview.objectiveLabel")}
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value as PitchObjective)}
            className="rounded-md border border-aff-line bg-transparent px-2 py-2 text-[13px] text-aff-text"
          >
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>
                {t(`objectives.${o}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12.5px] text-aff-muted">
          {t("overview.audienceLabel")}
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as PitchAudience)}
            className="rounded-md border border-aff-line bg-transparent px-2 py-2 text-[13px] text-aff-text"
          >
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {t(`audiences.${a}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12.5px] text-aff-muted">
          {t("overview.pitchTypeLabel")}
          <select
            value={pitchType}
            onChange={(e) => setPitchType(e.target.value as PitchType)}
            className="rounded-md border border-aff-line bg-transparent px-2 py-2 text-[13px] text-aff-text"
          >
            {PITCH_TYPES.map((p) => (
              <option key={p} value={p}>
                {t(`pitchTypes.${p}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button onClick={handleCreate} className="mt-4 px-4 py-2.5 text-[13.5px]">
        {t("overview.createCta")}
      </Button>
    </DashboardSection>
  );
}

export function PitchLabView({ dataByStartupId }: { dataByStartupId: Record<string, PitchLabEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.pitch");
  const format = useFormatter();

  const formatDate = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  if (!entry) return null;

  if (!entry.workspace || !entry.activeVersion) {
    return (
      <div className="mx-auto flex max-w-[900px] flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
          <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
        </div>
        <DashboardSection title={t("overview.noPitchTitle")}>
          <p className="mb-4 text-[13.5px] text-aff-muted">{t("overview.noPitchBody")}</p>
        </DashboardSection>
        <SetupForm startupId={activeStartup.id} />
      </div>
    );
  }

  const { workspace, activeVersion, requiredTotal, requiredComplete, unresolvedFeedback } = entry;
  const readiness = activeVersion.readiness;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      <DashboardSection title={t("overview.activePitch")}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[16px] font-semibold text-aff-text">
              {activeVersion.title} · {t("overview.versionLabel", { version: activeVersion.version })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] text-aff-muted sm:grid-cols-4">
              <div>
                {t("overview.readinessLabel")}: {readiness ? `${readiness.score}/100` : "—"}
              </div>
              <div>{t("overview.sectionsComplete", { done: requiredComplete, total: requiredTotal })}</div>
              <div>{t("overview.unresolvedFeedback", { count: unresolvedFeedback })}</div>
              <div>{t("overview.lastUpdated", { date: formatDate(activeVersion.updatedAt) })}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/dashboard/pitch/editor" className="px-4 py-2.5 text-[13px]">
              {t("overview.continueEditing")}
            </ButtonLink>
            <ButtonLink href="/dashboard/pitch/practice" variant="secondary" className="px-4 py-2.5 text-[13px]">
              {t("overview.practicePitch")}
            </ButtonLink>
            <ButtonLink href="/dashboard/pitch/review" variant="secondary" className="px-4 py-2.5 text-[13px]">
              {t("overview.requestReview")}
            </ButtonLink>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-aff-muted">{t("overview.requestReviewComingSoon")}</p>
      </DashboardSection>

      {readiness ? (
        <DashboardSection title={t("readiness.title")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="font-heading text-[36px] font-semibold leading-none text-aff-text">
              {readiness.score}
              <span className="text-lg font-medium text-aff-muted">{t("readiness.scoreSuffix")}</span>
            </div>
            <div className="text-[13px] text-aff-muted">
              {t("readiness.confidenceLabel")}: {readiness.confidence}% · {t("readiness.forLabel", { title: activeVersion.title })}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {readiness.dimensions.map((d) => (
              <div key={d.key} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-aff-muted">{t(`readiness.dimensions.${d.key}`)}</span>
                <span className="font-semibold text-aff-text">{d.score}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-aff-muted">{t("readiness.confidenceDisclaimer")}</p>
          <p className="mt-1 text-[12px] font-semibold text-aff-muted">{t("readiness.notInvestmentJudgment")}</p>
        </DashboardSection>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <ButtonLink href="/dashboard/pitch/qna" variant="secondary" className="justify-center px-4 py-3 text-[13px]">
          {t("qna.pageTitle")}
        </ButtonLink>
        <ButtonLink href="/dashboard/pitch/review" variant="secondary" className="justify-center px-4 py-3 text-[13px]">
          {t("review.pageTitle")}
        </ButtonLink>
        <ButtonLink href="/dashboard/pitch-live" variant="secondary" className="justify-center px-4 py-3 text-[13px]">
          Pitch Live
        </ButtonLink>
      </div>

      <p className="text-[12px] text-aff-muted">{workspace.versions.length} version(s) · {t("versions.title")}</p>
    </div>
  );
}
