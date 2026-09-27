"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StepDots } from "./StepDots";
import { TextField } from "./TextField";
import { TextAreaField } from "./TextAreaField";
import { ReviewRow } from "./ReviewRow";
import { FormNav } from "./FormNav";
import { SuccessPanel } from "./SuccessPanel";
import { submitPitchApplication } from "@/lib/services/submission";
import type { ApplyToPitchFormData } from "@/types/forms";

const TOTAL_STEPS = 5;

const emptyForm: ApplyToPitchFormData = {
  founder: "",
  startup: "",
  country: "",
  sector: "",
  stage: "",
  website: "",
  oneLiner: "",
  problem: "",
  solution: "",
  traction: "",
  challenge: "",
  video: "",
  linkedin: "",
  question: "",
};

export function ApplyToPitchForm() {
  const t = useTranslations("applyToPitch");
  const tc = useTranslations("common");
  const reviewLabels = t.raw("reviewLabels") as string[];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ApplyToPitchFormData>(emptyForm);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");

  const canAdvance: Record<number, boolean> = {
    1: !!form.founder && !!form.startup && !!form.country,
    2: !!form.oneLiner && !!form.problem,
    3: true,
    4: !!form.question,
  };

  const setField =
    (key: keyof ApplyToPitchFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const next = () => {
    if (step < TOTAL_STEPS && canAdvance[step]) setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    setStatus("loading");
    try {
      const result = await submitPitchApplication(form);
      setStatus(result.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <SuccessPanel title={t("successTitle")} body={t("successBody")} ctaLabel={tc("backHome")} />
    );
  }

  const dash = "—";
  const reviewValues = [
    form.founder,
    form.startup,
    `${form.country || dash} / ${form.sector || dash}`,
    form.oneLiner,
    form.video,
    form.question,
  ];

  return (
    <div className="mx-auto max-w-xl px-6 pb-32 pt-10 sm:pt-14">
      <StepDots total={TOTAL_STEPS} current={step} />
      <div className="mb-3 text-xs font-semibold tracking-[0.1em] text-aff-accent">
        {t("stepLabel")} {step} / {TOTAL_STEPS}
      </div>

      {step === 1 ? (
        <div>
          <h1 className="mb-7 font-heading text-[28px] font-semibold text-aff-text sm:text-[32px]">
            {t("step1Title")}
          </h1>
          <div className="flex flex-col gap-[18px]">
            <TextField id="ap-founder" label={t("founder")} value={form.founder} onChange={setField("founder")} />
            <TextField id="ap-startup" label={t("startup")} value={form.startup} onChange={setField("startup")} />
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <TextField id="ap-country" label={t("country")} value={form.country} onChange={setField("country")} />
              </div>
              <div className="flex-1">
                <TextField id="ap-sector" label={t("sector")} value={form.sector} onChange={setField("sector")} />
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <TextField id="ap-stage" label={t("stage")} value={form.stage} onChange={setField("stage")} />
              </div>
              <div className="flex-1">
                <TextField id="ap-website" label={t("website")} placeholder="https://" value={form.website} onChange={setField("website")} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <h1 className="mb-7 font-heading text-[28px] font-semibold text-aff-text sm:text-[32px]">
            {t("step2Title")}
          </h1>
          <div className="flex flex-col gap-[18px]">
            <TextField id="ap-oneliner" label={t("oneLiner")} value={form.oneLiner} onChange={setField("oneLiner")} />
            <TextAreaField id="ap-problem" label={t("problem")} rows={2} value={form.problem} onChange={setField("problem")} />
            <TextAreaField id="ap-solution" label={t("solution")} rows={2} value={form.solution} onChange={setField("solution")} />
            <TextAreaField id="ap-traction" label={t("traction")} rows={2} value={form.traction} onChange={setField("traction")} />
            <TextAreaField id="ap-challenge" label={t("challenge")} rows={2} value={form.challenge} onChange={setField("challenge")} />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <h1 className="mb-2.5 font-heading text-[28px] font-semibold text-aff-text sm:text-[32px]">
            {t("step3Title")}
          </h1>
          <p className="mb-7 text-sm text-aff-muted">{t("step3Sub")}</p>
          <div className="flex flex-col gap-[18px]">
            <div>
              <div className="mb-2 block text-[13px] font-semibold text-aff-muted">
                {t("deck")}
              </div>
              <div className="rounded-lg border border-dashed border-aff-line p-5 text-sm text-aff-muted">
                {t("deckHint")}
              </div>
            </div>
            <TextField id="ap-video" label={t("video")} placeholder="https://" value={form.video} onChange={setField("video")} />
            <TextField id="ap-linkedin" label={t("linkedin")} placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={setField("linkedin")} />
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div>
          <h1 className="mb-3 font-heading text-[28px] font-semibold text-aff-text sm:text-[32px]">
            {t("step4Title")}
          </h1>
          <p className="mb-6 text-[15px] text-aff-muted">{t("step4Sub")}</p>
          <TextAreaField id="ap-question" label="" aria-label={t("step4Title")} rows={5} value={form.question} onChange={setField("question")} />
        </div>
      ) : null}

      {step === 5 ? (
        <div>
          <h1 className="mb-7 font-heading text-[28px] font-semibold text-aff-text sm:text-[32px]">
            {t("step5Title")}
          </h1>
          <div className="overflow-hidden rounded-xl border border-aff-line">
            {reviewLabels.map((label, i) => (
              <ReviewRow key={label} label={label} value={reviewValues[i] || dash} />
            ))}
          </div>
          <p className="mt-5 text-[13px] text-aff-muted">{t("noGuarantee")}</p>
          {status === "error" ? (
            <p role="alert" className="mt-4 text-sm text-red-400">
              Something went wrong. Please try again.
            </p>
          ) : null}
        </div>
      ) : null}

      <FormNav
        showBack={step > 1}
        onBack={back}
        backLabel={tc("back")}
        primaryLabel={step < TOTAL_STEPS ? tc("continue") : tc("submit")}
        onPrimary={step < TOTAL_STEPS ? next : submit}
        primaryDisabled={step < TOTAL_STEPS ? !canAdvance[step] : status === "loading"}
        primaryLoading={status === "loading"}
      />

      <div className="mt-10 text-center text-sm text-aff-muted">
        <Link href="/" className="no-underline">
          {tc("cancel")}
        </Link>
      </div>
    </div>
  );
}
