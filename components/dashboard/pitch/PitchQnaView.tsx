"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { saveQnaAnswerAction, setQnaAnswerStatusAction } from "@/lib/actions/pitch";
import type { QnaAnswerState, QnaAnswerStatus, QnaQuestionTemplate } from "@/types/pitch";
import { cn } from "@/lib/utils";

export type PitchQnaEntry = {
  questions: QnaQuestionTemplate[];
  answers: QnaAnswerState[];
};

const STATUS_TONE: Record<QnaAnswerStatus, string> = {
  not_started: "text-aff-muted",
  drafted: "text-aff-cyan",
  prepared: "text-aff-accent",
  needs_work: "text-amber-400",
};

function QuestionRow({ startupId, question, answer }: { startupId: string; question: QnaQuestionTemplate; answer?: QnaAnswerState }) {
  const t = useTranslations("dashboard.pitch.qna");
  const tKey = useTranslations();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(answer?.answer ?? "");
  const status = answer?.status ?? "not_started";

  const handleSave = () => {
    startTransition(async () => {
      await saveQnaAnswerAction(startupId, question.id, value);
      router.refresh();
    });
  };

  const setStatus = (s: QnaAnswerStatus) => {
    startTransition(async () => {
      await setQnaAnswerStatusAction(startupId, question.id, s);
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border border-aff-line p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-aff-text">{tKey(question.questionKey)}</p>
        <span className={cn("text-[11px] font-semibold", STATUS_TONE[status])}>{t(`statusLabels.${status}`)}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="mt-2 w-full rounded-md border border-aff-line bg-transparent px-2.5 py-1.5 text-[12.5px] text-aff-text"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={handleSave} className="px-3 py-1.5 text-[11.5px]">
          {answer?.answer ? t("editAnswer") : t("prepareAnswer")}
        </Button>
        <Button variant="secondary" onClick={() => setStatus("prepared")} className="px-3 py-1.5 text-[11.5px]">
          {t("markPrepared")}
        </Button>
        <Button variant="secondary" onClick={() => setStatus("needs_work")} className="px-3 py-1.5 text-[11.5px]">
          {t("markNeedsWork")}
        </Button>
      </div>
    </div>
  );
}

export function PitchQnaView({ dataByStartupId }: { dataByStartupId: Record<string, PitchQnaEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.pitch.qna");

  if (!entry) return null;

  const grouped = entry.questions.reduce<Record<string, QnaQuestionTemplate[]>>((acc, q) => {
    (acc[q.category] ??= []).push(q);
    return acc;
  }, {});

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      {entry.questions.length === 0 ? (
        <EmptyState title={t("pageTitle")} />
      ) : (
        Object.entries(grouped).map(([category, questions]) => (
          <DashboardSection key={category} title={t(`categories.${category}`)}>
            <div className="flex flex-col gap-3">
              {questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  startupId={activeStartup.id}
                  question={q}
                  answer={entry.answers.find((a) => a.questionId === q.id)}
                />
              ))}
            </div>
          </DashboardSection>
        ))
      )}
    </div>
  );
}
