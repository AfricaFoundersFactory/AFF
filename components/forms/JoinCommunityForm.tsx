"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StepDots } from "./StepDots";
import { TextField } from "./TextField";
import { TextAreaField } from "./TextAreaField";
import { RoleOptionCard } from "./RoleOptionCard";
import { ReviewRow } from "./ReviewRow";
import { FormNav } from "./FormNav";
import { SuccessPanel } from "./SuccessPanel";
import { submitCommunityApplication } from "@/lib/services/submission";
import type { JoinCommunityFormData } from "@/types/forms";

const TOTAL_STEPS = 5;

const emptyForm: JoinCommunityFormData = {
  role: "",
  name: "",
  email: "",
  country: "",
  startup: "",
  sector: "",
  stage: "",
  description: "",
  challenge: "",
  why: "",
};

export function JoinCommunityForm() {
  const t = useTranslations("joinCommunity");
  const tc = useTranslations("common");
  const roles = t.raw("roles") as string[];
  const reviewLabels = t.raw("reviewLabels") as string[];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<JoinCommunityFormData>(emptyForm);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");

  const isFounderRole = form.role === roles[0] || form.role === roles[1];

  const canAdvance: Record<number, boolean> = {
    1: !!form.role,
    2: !!form.name && !!form.email && !!form.country,
    3: !!form.description,
    4: !!form.why,
  };

  const setField =
    (key: keyof JoinCommunityFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const next = () => {
    if (step < TOTAL_STEPS && canAdvance[step]) setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    setStatus("loading");
    try {
      const result = await submitCommunityApplication(form);
      setStatus(result.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <SuccessPanel
        title={t("successTitle")}
        body={t("successBody")}
        ctaLabel={tc("backHome")}
      />
    );
  }

  const dash = "—";
  const reviewValues = [
    form.role,
    form.name,
    form.email,
    form.country,
    form.description,
    form.why,
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
          <div className="flex flex-col gap-3">
            {roles.map((role) => (
              <RoleOptionCard
                key={role}
                label={role}
                selected={form.role === role}
                onSelect={() => setForm((f) => ({ ...f, role }))}
              />
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <h1 className="mb-7 font-heading text-[28px] font-semibold text-aff-text sm:text-[32px]">
            {t("step2Title")}
          </h1>
          <div className="flex flex-col gap-[18px]">
            <TextField id="jc-name" label={t("fullName")} value={form.name} onChange={setField("name")} placeholder="e.g. Amina Diallo" />
            <TextField id="jc-email" label={t("email")} type="email" value={form.email} onChange={setField("email")} placeholder="you@email.com" />
            <TextField id="jc-country" label={t("country")} value={form.country} onChange={setField("country")} placeholder="e.g. Côte d'Ivoire" />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <h1 className="mb-2.5 font-heading text-[28px] font-semibold text-aff-text sm:text-[32px]">
            {t("step3Title")}
          </h1>
          <p className="mb-7 text-sm text-aff-muted">
            {isFounderRole ? t("roleHintFounder") : t("roleHintOther")}
          </p>
          <div className="flex flex-col gap-[18px]">
            {isFounderRole ? (
              <>
                <TextField id="jc-startup" label={t("startupName")} value={form.startup} onChange={setField("startup")} />
                <TextField id="jc-sector" label={t("sector")} value={form.sector} onChange={setField("sector")} />
                <TextField id="jc-stage" label={t("stage")} value={form.stage} onChange={setField("stage")} />
              </>
            ) : null}
            <TextAreaField id="jc-description" label={t("description")} rows={3} value={form.description} onChange={setField("description")} />
            <TextAreaField id="jc-challenge" label={t("challenge")} rows={3} value={form.challenge} onChange={setField("challenge")} />
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div>
          <h1 className="mb-7 font-heading text-[28px] font-semibold text-aff-text sm:text-[32px]">
            {t("step4Title")}
          </h1>
          <TextAreaField id="jc-why" label="" aria-label={t("step4Title")} rows={6} value={form.why} onChange={setField("why")} />
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
