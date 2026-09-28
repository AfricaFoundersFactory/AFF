"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { PitchLiveReadiness, PitchReadinessResult, PitchVersion } from "@/types/pitch";
import { cn } from "@/lib/utils";

export type PitchLiveEntry = {
  activeVersion: PitchVersion | undefined;
  readiness: PitchReadinessResult | undefined;
  liveReadiness: PitchLiveReadiness;
  practiceAttemptCount: number;
  openCriticalFeedbackCount: number;
};

export function PitchLiveView({ dataByStartupId }: { dataByStartupId: Record<string, PitchLiveEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.pitch.live");
  const [showApplyNote, setShowApplyNote] = useState(false);

  if (!entry) return null;

  if (!entry.activeVersion) {
    return (
      <div className="mx-auto flex max-w-[900px] flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
          <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
        </div>
        <DashboardSection title={t("noPitchTitle")}>
          <p className="mb-4 text-[13.5px] text-aff-muted">{t("noPitchBody")}</p>
          <ButtonLink href="/dashboard/pitch" className="px-4 py-2.5 text-[13.5px]">
            {t("noPitchTitle")}
          </ButtonLink>
        </DashboardSection>
      </div>
    );
  }

  const { readiness, liveReadiness, practiceAttemptCount, openCriticalFeedbackCount } = entry;
  const reqs = liveReadiness.requirements;

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      <DashboardSection title={liveReadiness.ready ? t("readyTitle") : t("notReadyTitle")}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-[13px] text-aff-muted">
            {t("pageTitle")}: <span className="font-semibold text-aff-text">{readiness ? `${readiness.score}/100` : "—"}</span>
          </div>
          <div className="text-[13px] text-aff-muted">
            Practice: <span className="font-semibold text-aff-text">{practiceAttemptCount}</span>
          </div>
          <div className="text-[13px] text-aff-muted">
            Critical: <span className="font-semibold text-aff-text">{openCriticalFeedbackCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {(Object.keys(reqs) as Array<keyof typeof reqs>).map((key) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-aff-line px-3 py-2">
              <span className="text-[13px] text-aff-text">{t(`requirements.${key}`)}</span>
              <span className={cn("text-[12px] font-semibold", reqs[key] ? "text-aff-accent" : "text-aff-muted")}>
                {reqs[key] ? "✓" : "—"}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[12px] font-semibold text-aff-muted">{t("disclaimer")}</p>

        <Button onClick={() => setShowApplyNote(true)} className="mt-4 px-4 py-2.5 text-[13.5px]" disabled={!liveReadiness.ready}>
          {t("applyCta")}
        </Button>
        {showApplyNote ? <p className="mt-2 text-[12px] text-aff-muted">{t("applyComingSoon")}</p> : null}
      </DashboardSection>
    </div>
  );
}
