"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { StepDots } from "@/components/forms/StepDots";
import { FormNav } from "@/components/forms/FormNav";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { ReviewRow } from "@/components/forms/ReviewRow";
import { SuccessPanel } from "@/components/forms/SuccessPanel";
import { saveOnboardingDraftAction, completeOnboardingAction } from "@/lib/actions/digital-twin";
import { toStringList } from "@/lib/validation";
import type { StartupDigitalTwin, TractionMetricType, BusinessModelType, FundingInstrument } from "@/types/digital-twin";
import type { StartupStage } from "@/types/common";

const TOTAL_STEPS = 12;
const STAGES: StartupStage[] = ["idea", "mvp", "early_traction", "growth", "scale"];
const TRACTION_OPTIONS: TractionMetricType[] = ["revenue", "customers", "active_users", "mrr", "arr", "gmv", "pilots", "partnerships"];
const BUSINESS_TYPES: BusinessModelType[] = ["b2b", "b2c", "b2b2c", "marketplace", "saas", "subscription", "transactional", "licensing", "other"];
const INSTRUMENTS: FundingInstrument[] = ["equity", "safe", "convertible_note", "debt", "grant", "revenue_based_financing", "other"];

export function OnboardingFlow({ dataByStartupId }: { dataByStartupId: Record<string, StartupDigitalTwin> }) {
  const { activeStartup } = useStartup();
  const t = useTranslations("dashboard.onboarding");
  const tc = useTranslations("common");
  const tStage = useTranslations("dashboard.stage");
  const tDev = useTranslations("dashboard.digitalTwin.enums.developmentStage");
  const tTractionType = useTranslations("dashboard.digitalTwin.enums.tractionMetricType");
  const tBusinessType = useTranslations("dashboard.digitalTwin.enums.businessModelType");
  const tInstrument = useTranslations("dashboard.digitalTwin.enums.fundingInstrument");
  const router = useRouter();

  const startupId = activeStartup.id;
  const initialTwin = dataByStartupId[startupId];

  const [step, setStep] = useState(Math.max(1, initialTwin?.onboarding.currentStep ?? 1));
  const [twin, setTwin] = useState<StartupDigitalTwin>(() => initialTwin);
  const [selectedMetrics, setSelectedMetrics] = useState<TractionMetricType[]>(
    () => initialTwin?.traction.metrics.map((m) => m.type).filter((t) => TRACTION_OPTIONS.includes(t)) ?? [],
  );
  const [metricValues, setMetricValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((initialTwin?.traction.metrics ?? []).map((m) => [m.type, String(m.value)])),
  );
  const [goalTitles, setGoalTitles] = useState<string[]>(() => {
    const titles = (initialTwin?.goals ?? []).slice(0, 3).map((g) => g.title);
    return [titles[0] ?? "", titles[1] ?? "", titles[2] ?? ""];
  });
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");

  if (!twin) {
    return null;
  }

  const patch = <K extends keyof StartupDigitalTwin>(key: K, value: StartupDigitalTwin[K]) =>
    setTwin((cur) => ({ ...cur, [key]: value }));

  const canAdvance: Record<number, boolean> = {
    1: Boolean(twin.identity.name.trim() && twin.identity.country.trim()),
    2: Boolean(twin.problem.statement?.trim()),
    3: Boolean(twin.product.name?.trim()),
    4: true,
    5: true,
    6: true,
    7: twin.founders.length > 0,
    8: true,
    9: true,
    10: true,
    11: true,
  };

  const next = () => {
    if (step < TOTAL_STEPS && canAdvance[step]) setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const buildTractionMetrics = () =>
    selectedMetrics
      .filter((type) => metricValues[type]?.trim())
      .map((type) => ({
        id: twin.traction.metrics.find((m) => m.type === type)?.id ?? `${type}-${Date.now()}`,
        type,
        label: tTractionType(type),
        value: Number(metricValues[type]),
        date: new Date().toISOString().slice(0, 10),
        verified: false,
      }));

  const buildGoals = () =>
    goalTitles
      .filter((title) => title.trim())
      .map((title, i) => ({
        id: twin.goals[i]?.id ?? `goal-${i}-${Date.now()}`,
        title: title.trim(),
        category: "growth" as const,
        status: "not_started" as const,
        progressPct: 0,
      }));

  const draftForStep = (): StartupDigitalTwin => ({
    ...twin,
    traction: { ...twin.traction, metrics: buildTractionMetrics() },
    goals: buildGoals(),
  });

  const saveAndExit = async () => {
    setStatus("saving");
    await saveOnboardingDraftAction(startupId, draftForStep(), step);
    setStatus("idle");
    router.push("/dashboard/startup");
  };

  const complete = async () => {
    setStatus("saving");
    const result = await completeOnboardingAction(startupId, draftForStep());
    setStatus("idle");
    if (result.ok) {
      setStatus("done");
    }
  };

  if (status === "done") {
    return (
      <SuccessPanel
        title={t("successTitle")}
        body={t("successBody")}
        ctaLabel={t("goToMyStartup")}
        ctaHref="/dashboard/startup"
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 pb-32 pt-10 sm:pt-14">
      <StepDots total={TOTAL_STEPS} current={step} />
      <div className="mb-3 text-xs font-semibold tracking-[0.1em] text-aff-accent">
        {t("stepLabel")} {step} / {TOTAL_STEPS}
      </div>

      {step === 1 ? (
        <Step title={t("step1Title")}>
          <TextField id="ob-name" label={t("field.name")} value={twin.identity.name} onChange={(e) => patch("identity", { ...twin.identity, name: e.target.value })} />
          <TextField id="ob-tagline" label={t("field.tagline")} value={twin.identity.tagline ?? ""} onChange={(e) => patch("identity", { ...twin.identity, tagline: e.target.value })} />
          <TextField id="ob-website" label={t("field.website")} type="url" value={twin.identity.website ?? ""} onChange={(e) => patch("identity", { ...twin.identity, website: e.target.value })} />
          <div className="flex gap-3">
            <div className="flex-1">
              <TextField id="ob-country" label={t("field.country")} value={twin.identity.country} onChange={(e) => patch("identity", { ...twin.identity, country: e.target.value })} />
            </div>
            <div className="flex-1">
              <TextField id="ob-city" label={t("field.city")} value={twin.identity.city ?? ""} onChange={(e) => patch("identity", { ...twin.identity, city: e.target.value })} />
            </div>
          </div>
          <TextField id="ob-industry" label={t("field.industry")} value={twin.identity.industry ?? ""} onChange={(e) => patch("identity", { ...twin.identity, industry: e.target.value })} />
          <SelectField id="ob-stage" label={t("field.stage")} value={twin.identity.stage} onChange={(e) => patch("identity", { ...twin.identity, stage: e.target.value as StartupStage })}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {tStage(s)}
              </option>
            ))}
          </SelectField>
        </Step>
      ) : null}

      {step === 2 ? (
        <Step title={t("step2Title")}>
          <TextAreaField id="ob-problem" label={t("field.problemStatement")} rows={3} value={twin.problem.statement ?? ""} onChange={(e) => patch("problem", { ...twin.problem, statement: e.target.value })} />
          <TextField id="ob-target" label={t("field.targetCustomer")} value={twin.problem.targetCustomer ?? ""} onChange={(e) => patch("problem", { ...twin.problem, targetCustomer: e.target.value })} />
          <TextAreaField id="ob-alt" label={t("field.currentAlternatives")} rows={2} value={twin.problem.currentAlternatives ?? ""} onChange={(e) => patch("problem", { ...twin.problem, currentAlternatives: e.target.value })} />
          <TextAreaField id="ob-evidence" label={t("field.evidence")} rows={2} value={twin.problem.evidence ?? ""} onChange={(e) => patch("problem", { ...twin.problem, evidence: e.target.value })} />
        </Step>
      ) : null}

      {step === 3 ? (
        <Step title={t("step3Title")}>
          <TextField id="ob-product" label={t("field.productName")} value={twin.product.name ?? ""} onChange={(e) => patch("product", { ...twin.product, name: e.target.value })} />
          <TextAreaField id="ob-vp" label={t("field.valueProposition")} rows={2} value={twin.product.valueProposition ?? ""} onChange={(e) => patch("product", { ...twin.product, valueProposition: e.target.value })} />
          <SelectField id="ob-devstage" label={t("field.developmentStage")} value={twin.product.developmentStage ?? "concept"} onChange={(e) => patch("product", { ...twin.product, developmentStage: e.target.value as StartupDigitalTwin["product"]["developmentStage"] })}>
            {(["concept", "prototype", "mvp", "live", "scaling"] as const).map((s) => (
              <option key={s} value={s}>
                {tDev(s)}
              </option>
            ))}
          </SelectField>
          <TextField id="ob-features" label={t("field.coreFeatures")} placeholder={t("commaSeparated")} value={twin.product.coreFeatures.join(", ")} onChange={(e) => patch("product", { ...twin.product, coreFeatures: toStringList(e.target.value) })} />
        </Step>
      ) : null}

      {step === 4 ? (
        <Step title={t("step4Title")}>
          <TextField id="ob-segments" label={t("field.customerSegments")} placeholder={t("commaSeparated")} value={twin.market.customerSegments.join(", ")} onChange={(e) => patch("market", { ...twin.market, customerSegments: toStringList(e.target.value) })} />
          <TextField id="ob-geo" label={t("field.geographies")} placeholder={t("commaSeparated")} value={twin.market.geographies.join(", ")} onChange={(e) => patch("market", { ...twin.market, geographies: toStringList(e.target.value) })} />
          <TextField id="ob-competitors" label={t("field.competitors")} placeholder={t("commaSeparated")} value={twin.market.competitors.map((c) => c.name).join(", ")} onChange={(e) => patch("market", { ...twin.market, competitors: toStringList(e.target.value).map((name, i) => ({ id: twin.market.competitors[i]?.id ?? `${i}`, name })) })} />
          <p className="text-[13px] text-aff-muted">{t("marketSizingHint")}</p>
        </Step>
      ) : null}

      {step === 5 ? (
        <Step title={t("step5Title")}>
          <div>
            <div className="mb-2 text-[13px] font-semibold text-aff-muted">{t("field.businessModelType")}</div>
            <div className="flex flex-col gap-2">
              {BUSINESS_TYPES.map((type) => (
                <CheckboxField
                  key={type}
                  id={`ob-bt-${type}`}
                  label={tBusinessType(type)}
                  checked={twin.businessModel.types.includes(type)}
                  onChange={() =>
                    patch("businessModel", {
                      ...twin.businessModel,
                      types: twin.businessModel.types.includes(type)
                        ? twin.businessModel.types.filter((v) => v !== type)
                        : [...twin.businessModel.types, type],
                    })
                  }
                />
              ))}
            </div>
          </div>
          <TextField id="ob-pricing" label={t("field.pricingModel")} value={twin.businessModel.pricingModel ?? ""} onChange={(e) => patch("businessModel", { ...twin.businessModel, pricingModel: e.target.value })} />
          <TextField id="ob-revenue" label={t("field.revenueStreams")} placeholder={t("commaSeparated")} value={twin.businessModel.revenueStreams.map((r) => r.label).join(", ")} onChange={(e) => patch("businessModel", { ...twin.businessModel, revenueStreams: toStringList(e.target.value).map((label, i) => ({ id: twin.businessModel.revenueStreams[i]?.id ?? `${i}`, label })) })} />
          <TextField id="ob-channels" label={t("field.salesChannels")} placeholder={t("commaSeparated")} value={twin.businessModel.salesChannels.join(", ")} onChange={(e) => patch("businessModel", { ...twin.businessModel, salesChannels: toStringList(e.target.value) })} />
        </Step>
      ) : null}

      {step === 6 ? (
        <Step title={t("step6Title")}>
          <p className="mb-2 text-[13px] text-aff-muted">{t("tractionHint")}</p>
          <div className="flex flex-col gap-3">
            {TRACTION_OPTIONS.map((type) => (
              <div key={type}>
                <CheckboxField
                  id={`ob-tm-${type}`}
                  label={tTractionType(type)}
                  checked={selectedMetrics.includes(type)}
                  onChange={() =>
                    setSelectedMetrics((cur) => (cur.includes(type) ? cur.filter((v) => v !== type) : [...cur, type]))
                  }
                />
                {selectedMetrics.includes(type) ? (
                  <div className="mt-2 pl-7">
                    <TextField
                      id={`ob-tmv-${type}`}
                      label={t("field.value")}
                      type="number"
                      value={metricValues[type] ?? ""}
                      onChange={(e) => setMetricValues((cur) => ({ ...cur, [type]: e.target.value }))}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Step>
      ) : null}

      {step === 7 ? (
        <Step title={t("step7Title")}>
          <p className="mb-3 text-[13px] text-aff-muted">{t("teamHint")}</p>
          {twin.founders.length === 0 ? (
            <p className="mb-3 text-[13.5px] text-amber-400">{t("noFoundersWarning")}</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-1.5">
              {twin.founders.map((f) => (
                <li key={f.id} className="text-[14px] text-aff-text">
                  {f.firstName} {f.lastName} — {f.role}
                </li>
              ))}
            </ul>
          )}
          {twin.team.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {twin.team.map((m) => (
                <li key={m.id} className="text-[13.5px] text-aff-muted">
                  {m.name} — {m.role}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-[13px] text-aff-muted">{t("teamEditHint")}</p>
        </Step>
      ) : null}

      {step === 8 ? (
        <Step title={t("step8Title")}>
          <p className="mb-2 text-[13px] text-aff-muted">{t("dontKnowHint")}</p>
          <TextField id="ob-fin-rev" label={t("field.monthlyRevenue")} type="number" value={twin.financials.monthlyRevenue ?? ""} onChange={(e) => patch("financials", { ...twin.financials, monthlyRevenue: e.target.value ? Number(e.target.value) : undefined })} />
          <TextField id="ob-fin-exp" label={t("field.monthlyExpenses")} type="number" value={twin.financials.monthlyExpenses ?? ""} onChange={(e) => patch("financials", { ...twin.financials, monthlyExpenses: e.target.value ? Number(e.target.value) : undefined })} />
          <TextField id="ob-fin-burn" label={t("field.monthlyBurn")} type="number" value={twin.financials.monthlyBurn ?? ""} onChange={(e) => patch("financials", { ...twin.financials, monthlyBurn: e.target.value ? Number(e.target.value) : undefined })} />
          <TextField id="ob-fin-cash" label={t("field.cashBalance")} type="number" value={twin.financials.cashBalance ?? ""} onChange={(e) => patch("financials", { ...twin.financials, cashBalance: e.target.value ? Number(e.target.value) : undefined })} />
        </Step>
      ) : null}

      {step === 9 ? (
        <Step title={t("step9Title")}>
          <TextField id="ob-raised" label={t("field.totalRaisedAmount")} type="number" value={twin.funding.totalRaised?.amount ?? ""} onChange={(e) => patch("funding", { ...twin.funding, totalRaised: e.target.value ? { amount: Number(e.target.value), currency: twin.funding.totalRaised?.currency ?? twin.identity.preferredCurrency } : undefined })} />
          <SelectField
            id="ob-fundraising"
            label={t("field.fundraisingStatus")}
            value={twin.funding.status}
            onChange={(e) => patch("funding", { ...twin.funding, status: e.target.value as StartupDigitalTwin["funding"]["status"] })}
          >
            <option value="not_raising">{t("notRaising")}</option>
            <option value="raising">{t("currentlyRaising")}</option>
            <option value="closed">{t("closed")}</option>
          </SelectField>
          {twin.funding.status === "raising" ? (
            <TextField id="ob-target" label={t("field.targetRaiseAmount")} type="number" value={twin.funding.targetRaise?.amount ?? ""} onChange={(e) => patch("funding", { ...twin.funding, targetRaise: e.target.value ? { amount: Number(e.target.value), currency: twin.funding.targetRaise?.currency ?? twin.identity.preferredCurrency } : undefined })} />
          ) : null}
          <SelectField id="ob-instrument" label={t("field.instrument")} value={twin.funding.instrument ?? "equity"} onChange={(e) => patch("funding", { ...twin.funding, instrument: e.target.value as FundingInstrument })}>
            {INSTRUMENTS.map((i) => (
              <option key={i} value={i}>
                {tInstrument(i)}
              </option>
            ))}
          </SelectField>
        </Step>
      ) : null}

      {step === 10 ? (
        <Step title={t("step10Title")}>
          <CheckboxField id="ob-impact" label={t("trackImpact")} checked={twin.impact.enabled} onChange={(e) => patch("impact", { ...twin.impact, enabled: e.target.checked })} />
          {!twin.impact.enabled ? <p className="mt-2 text-[13px] text-aff-muted">{t("impactNotTracked")}</p> : null}
          {twin.impact.enabled ? (
            <TextAreaField id="ob-thesis" label={t("field.thesis")} rows={2} value={twin.impact.thesis ?? ""} onChange={(e) => patch("impact", { ...twin.impact, thesis: e.target.value })} />
          ) : null}
        </Step>
      ) : null}

      {step === 11 ? (
        <Step title={t("step11Title")}>
          <p className="mb-3 text-[13px] text-aff-muted">{t("goalsHint")}</p>
          {[0, 1, 2].map((i) => (
            <TextField
              key={i}
              id={`ob-goal-${i}`}
              label={t("goalLabel", { n: i + 1 })}
              value={goalTitles[i]}
              onChange={(e) => setGoalTitles((cur) => cur.map((v, idx) => (idx === i ? e.target.value : v)))}
            />
          ))}
        </Step>
      ) : null}

      {step === 12 ? (
        <Step title={t("step12Title")}>
          <div className="overflow-hidden rounded-xl border border-aff-line">
            <ReviewRow label={t("field.name")} value={twin.identity.name || "—"} />
            <ReviewRow label={t("field.stage")} value={tStage(twin.identity.stage)} />
            <ReviewRow label={t("field.problemStatement")} value={twin.problem.statement || "—"} />
            <ReviewRow label={t("field.productName")} value={twin.product.name || "—"} />
            <ReviewRow label={t("field.customerSegments")} value={twin.market.customerSegments.join(", ") || "—"} />
            <ReviewRow label={t("step6Title")} value={String(buildTractionMetrics().length)} />
            <ReviewRow label={t("step7Title")} value={String(twin.founders.length)} />
            <ReviewRow label={t("step11Title")} value={String(buildGoals().length)} />
          </div>
        </Step>
      ) : null}

      <div className="mt-11 flex items-center justify-between gap-3">
        <button type="button" onClick={saveAndExit} className="text-[13.5px] font-semibold text-aff-muted hover:text-aff-text">
          {t("saveAndExit")}
        </button>
        <FormNav
          showBack={step > 1}
          onBack={back}
          backLabel={tc("back")}
          primaryLabel={step < TOTAL_STEPS ? tc("continue") : t("complete")}
          onPrimary={step < TOTAL_STEPS ? next : complete}
          primaryDisabled={step < TOTAL_STEPS ? !canAdvance[step] : status === "saving"}
          primaryLoading={status === "saving"}
        />
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-7 font-heading text-[26px] font-semibold text-aff-text sm:text-[30px]">{title}</h1>
      <div className="flex flex-col gap-[18px]">{children}</div>
    </div>
  );
}
