"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { SectionTabs } from "@/components/dashboard/twin/shared";
import { SuccessPanel } from "@/components/forms/SuccessPanel";
import { Button } from "@/components/ui/Button";
import { QuestionField } from "./QuestionField";
import { READINESS_QUESTIONS } from "@/lib/readiness/questions";
import { saveAssessmentAnswersAction, completeAssessmentAction } from "@/lib/actions/readiness";
import { DIMENSION_KEYS } from "@/types/readiness-engine";
import type { AssessmentAnswerValue, DimensionKey, ReadinessAssessment } from "@/types/readiness-engine";
import type { StartupDigitalTwin } from "@/types/digital-twin";

export type AssessmentEntry = { twin: StartupDigitalTwin; draft: ReadinessAssessment };

export function AssessmentFlow({ dataByStartupId }: { dataByStartupId: Record<string, AssessmentEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];

  const t = useTranslations("dashboard.readiness");
  const tDim = useTranslations("dashboard.readiness.dimensions");
  const tc = useTranslations("common");
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, AssessmentAnswerValue>>(() =>
    Object.fromEntries((entry?.draft.answers ?? []).map((a) => [a.questionId, a.value])),
  );
  const [dimension, setDimension] = useState<DimensionKey>("problem_market");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const applicableQuestions = useMemo(() => {
    if (!entry) return [];
    return READINESS_QUESTIONS.filter(
      (q) => !q.applicableIf || q.applicableIf({ twin: entry.twin, answers, stage: entry.twin.identity.stage }),
    );
  }, [entry, answers]);

  if (!entry) return null;

  const answeredCount = applicableQuestions.filter((q) => answers[q.id] !== undefined).length;
  const progressPct = applicableQuestions.length === 0 ? 100 : Math.round((answeredCount / applicableQuestions.length) * 100);

  const questionsInDimension = applicableQuestions.filter((q) => q.dimension === dimension);

  const setAnswer = (questionId: string, value: AssessmentAnswerValue) => {
    setAnswers((cur) => ({ ...cur, [questionId]: value }));
  };

  const persist = async () => {
    await saveAssessmentAnswersAction(activeStartup.id, answers);
  };

  const saveAndExit = async () => {
    setSaving(true);
    await persist();
    setSaving(false);
    router.push("/dashboard/readiness");
  };

  const complete = async () => {
    setSaving(true);
    await persist();
    const result = await completeAssessmentAction(activeStartup.id);
    setSaving(false);
    if (result.ok) {
      setDone(true);
      router.refresh();
    }
  };

  if (done) {
    return (
      <SuccessPanel
        title={t("assessmentSuccessTitle")}
        body={t("assessmentSuccessBody")}
        ctaLabel={t("backToReadiness")}
        ctaHref="/dashboard/readiness"
      />
    );
  }

  const tabs = DIMENSION_KEYS.map((key) => ({ key, label: tDim(`${key}.label`) }));
  const dimensionIndex = DIMENSION_KEYS.indexOf(dimension);
  const isLastDimension = dimensionIndex === DIMENSION_KEYS.length - 1;

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("assessmentTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("assessmentIntro")}</p>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between text-[13px]">
          <span className="font-semibold text-aff-muted">{t("assessmentProgress", { pct: progressPct })}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-aff-line/50">
          <div className="h-full rounded-full bg-aff-cyan transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <SectionTabs tabs={tabs} active={dimension} onChange={(key) => setDimension(key as DimensionKey)} />

      <div className="flex flex-col gap-6 rounded-2xl border border-aff-line bg-aff-bg2 p-6">
        {questionsInDimension.length > 0 ? (
          questionsInDimension.map((question) => (
            <QuestionField
              key={question.id}
              question={question}
              value={answers[question.id]}
              onChange={(value) => setAnswer(question.id, value)}
            />
          ))
        ) : (
          <p className="text-[13.5px] text-aff-muted">{t("assessmentIntro")}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={saveAndExit} className="text-[13.5px] font-semibold text-aff-muted hover:text-aff-text">
          {t("saveAndExit")}
        </button>
        <div className="flex gap-3">
          {dimensionIndex > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setDimension(DIMENSION_KEYS[dimensionIndex - 1])}>
              {tc("back")}
            </Button>
          ) : null}
          {!isLastDimension ? (
            <Button type="button" onClick={() => setDimension(DIMENSION_KEYS[dimensionIndex + 1])}>
              {tc("continue")}
            </Button>
          ) : (
            <Button type="button" onClick={complete} disabled={saving}>
              {saving ? "…" : t("completeAssessment")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
