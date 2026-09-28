"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { startPracticeAttemptAction, completePracticeAttemptAction } from "@/lib/actions/pitch";
import { recommendedStructure, FORMAT_DURATION_SECONDS } from "@/lib/pitch/practice-structure";
import type { FounderSelfRatings, PitchPracticeAttempt, PitchPracticeFormat, PitchVersion } from "@/types/pitch";
import { cn } from "@/lib/utils";

export type PitchPracticeEntry = {
  activeVersion: PitchVersion | undefined;
  attempts: PitchPracticeAttempt[];
};

const FORMATS: PitchPracticeFormat[] = ["30s", "1min", "3min", "5min"];

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PitchPracticeView({ dataByStartupId }: { dataByStartupId: Record<string, PitchPracticeEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.pitch.practice");
  const tSections = useTranslations("dashboard.pitch.sections");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [format, setFormat] = useState<PitchPracticeFormat>("3min");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<FounderSelfRatings>({ clarity: 3, confidence: 3, timing: 3, storytelling: 3 });
  const [notes, setNotes] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const structure = recommendedStructure(format);
  const totalSeconds = FORMAT_DURATION_SECONDS[format];

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  if (!entry) return null;

  const version = entry.activeVersion;
  const script = version
    ? structure
        .map((seg) => version.sections.find((s) => s.type === seg.sectionType))
        .filter((s): s is NonNullable<typeof s> => Boolean(s?.content))
        .map((s) => s.content)
        .join("\n\n")
    : "";

  const handleStart = () => {
    if (!version) return;
    setElapsed(0);
    setRunning(true);
    startTransition(async () => {
      const result = await startPracticeAttemptAction(activeStartup.id, version.id, format);
      if (result.ok) setAttemptId(result.data.id);
    });
  };

  const handleStop = () => {
    setRunning(false);
  };

  const handleSave = () => {
    if (!attemptId) return;
    startTransition(async () => {
      await completePracticeAttemptAction(activeStartup.id, attemptId, { actualDurationSeconds: elapsed, founderRatings: ratings, notes });
      setAttemptId(null);
      setElapsed(0);
      router.refresh();
    });
  };

  const currentSegment = structure.find((s) => elapsed >= s.startSeconds && elapsed < s.endSeconds);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      {!version ? (
        <EmptyState title={t("empty")} />
      ) : (
        <>
          <DashboardSection title={t("pageTitle")}>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFormat(f);
                    setElapsed(0);
                    setRunning(false);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-[12.5px] font-semibold",
                    format === f ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted",
                  )}
                >
                  {t(`formats.${f}`)}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-5">
              <div className="font-heading text-[40px] font-semibold tabular-nums text-aff-text">
                {formatSeconds(elapsed)} <span className="text-lg text-aff-muted">/ {formatSeconds(totalSeconds)}</span>
              </div>
              {!running ? (
                <Button onClick={handleStart} className="px-4 py-2.5 text-[13px]">
                  {t("start")}
                </Button>
              ) : (
                <Button variant="secondary" onClick={handleStop} className="px-4 py-2.5 text-[13px]">
                  {t("stop")}
                </Button>
              )}
            </div>
            {currentSegment ? (
              <p className="mt-2 text-[13px] font-semibold text-aff-cyan">{tSections(`${currentSegment.sectionType}.title`)}</p>
            ) : null}
          </DashboardSection>

          <DashboardSection title={t("structureTitle")}>
            <div className="flex flex-col gap-2">
              {structure.map((seg) => (
                <div
                  key={seg.sectionType}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-[12.5px]",
                    currentSegment?.sectionType === seg.sectionType ? "border-aff-accent text-aff-text" : "border-aff-line text-aff-muted",
                  )}
                >
                  <span>{tSections(`${seg.sectionType}.title`)}</span>
                  <span className="tabular-nums">
                    {formatSeconds(seg.startSeconds)}–{formatSeconds(seg.endSeconds)}
                  </span>
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection title={t("scriptTitle")}>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-aff-muted">{script || "—"}</p>
          </DashboardSection>

          {attemptId ? (
            <DashboardSection title={t("selfAssessmentTitle")}>
              <p className="mb-3 text-[12px] text-aff-muted">{t("selfAssessmentDisclaimer")}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                {(Object.keys(ratings) as Array<keyof FounderSelfRatings>).map((key) => (
                  <label key={key} className="flex flex-col gap-1 text-[12px] text-aff-muted">
                    {t(`ratings.${key}`)}
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings[key]}
                      onChange={(e) => setRatings({ ...ratings, [key]: Number(e.target.value) })}
                    />
                    <span className="text-aff-text">{ratings[key]}/5</span>
                  </label>
                ))}
              </div>
              <label className="mt-3 flex flex-col gap-1 text-[12px] text-aff-muted">
                {t("notesLabel")}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-md border border-aff-line bg-transparent px-2.5 py-1.5 text-[12.5px] text-aff-text"
                />
              </label>
              <Button onClick={handleSave} className="mt-3 px-4 py-2 text-[12.5px]">
                {t("saveAttempt")}
              </Button>
            </DashboardSection>
          ) : null}

          <DashboardSection title={t("historyTitle")}>
            {entry.attempts.length > 0 ? (
              <div className="flex flex-col gap-2">
                {entry.attempts
                  .filter((a) => a.completedAt)
                  .map((a) => (
                    <div key={a.id} className="rounded-lg border border-aff-line px-3 py-2 text-[12.5px] text-aff-muted">
                      {t(`formats.${a.format}`)} · {a.actualDurationSeconds ? formatSeconds(a.actualDurationSeconds) : "—"}
                      {a.founderRatings ? (
                        <span>
                          {" "}
                          · {t("ratings.clarity")} {a.founderRatings.clarity}/5
                        </span>
                      ) : null}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[13px] text-aff-muted">{t("empty")}</p>
            )}
          </DashboardSection>
        </>
      )}
    </div>
  );
}
