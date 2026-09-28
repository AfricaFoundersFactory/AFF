"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { ProfileCompletionBar, MissingInfoList, SectionCard, DetailRow } from "./shared";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { updateIdentityAction, updateProblemAction } from "@/lib/actions/digital-twin";
import { toStringList } from "@/lib/validation";
import type { StartupDigitalTwin, CompanyRegistrationStatus, PainSeverity } from "@/types/digital-twin";
import type { StartupStage } from "@/types/common";
import type { ProfileCompletion } from "@/types/profile-completion";

const STAGES: StartupStage[] = ["idea", "mvp", "early_traction", "growth", "scale"];
const REG_STATUSES: CompanyRegistrationStatus[] = ["not_registered", "in_progress", "registered"];
const SEVERITIES: PainSeverity[] = ["low", "medium", "high", "critical"];

export function OverviewTab({
  startupId,
  twin,
  completion,
  onSaved,
}: {
  startupId: string;
  twin: StartupDigitalTwin;
  completion: ProfileCompletion;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.myStartup.overview");
  const tc = useTranslations("common");
  const tStage = useTranslations("dashboard.stage");
  const tFields = useTranslations("dashboard.digitalTwin.fields");
  const tReg = useTranslations("dashboard.digitalTwin.enums.registrationStatus");
  const tSeverity = useTranslations("dashboard.digitalTwin.enums.painSeverity");
  const tp = useTranslations("dashboard.myStartup.problem");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const identity = twin.identity;
  const problem = twin.problem;

  const [form, setForm] = useState(() => toForm(twin));

  const [problemOpen, setProblemOpen] = useState(false);
  const [problemSaving, setProblemSaving] = useState(false);
  const [problemError, setProblemError] = useState<string | undefined>();
  const [problemForm, setProblemForm] = useState(() => toProblemForm(twin));

  function toProblemForm(t: StartupDigitalTwin) {
    return {
      statement: t.problem.statement ?? "",
      targetCustomer: t.problem.targetCustomer ?? "",
      currentAlternatives: t.problem.currentAlternatives ?? "",
      painSeverity: t.problem.painSeverity ?? ("medium" as PainSeverity),
      evidence: t.problem.evidence ?? "",
      whyNow: t.problem.whyNow ?? "",
    };
  }

  const openProblemPanel = () => {
    setProblemForm(toProblemForm(twin));
    setProblemError(undefined);
    setProblemOpen(true);
  };

  const handleProblemSave = async () => {
    setProblemSaving(true);
    const result = await updateProblemAction(startupId, {
      statement: problemForm.statement.trim() || undefined,
      targetCustomer: problemForm.targetCustomer.trim() || undefined,
      currentAlternatives: problemForm.currentAlternatives.trim() || undefined,
      painSeverity: problemForm.painSeverity,
      evidence: problemForm.evidence.trim() || undefined,
      whyNow: problemForm.whyNow.trim() || undefined,
    });
    setProblemSaving(false);
    if (!result.ok) {
      setProblemError(result.error);
      return;
    }
    setProblemOpen(false);
    onSaved();
  };

  function toForm(t: StartupDigitalTwin) {
    return {
      name: t.identity.name,
      tagline: t.identity.tagline ?? "",
      shortDescription: t.identity.shortDescription ?? "",
      longDescription: t.identity.longDescription ?? "",
      website: t.identity.website ?? "",
      foundedYear: t.identity.foundedYear ? String(t.identity.foundedYear) : "",
      country: t.identity.country,
      city: t.identity.city ?? "",
      operatingCountries: t.identity.operatingCountries.join(", "),
      industry: t.identity.industry ?? "",
      subIndustry: t.identity.subIndustry ?? "",
      stage: t.identity.stage,
      preferredCurrency: t.identity.preferredCurrency,
      registrationStatus: t.identity.registration?.status ?? "not_registered",
    };
  }

  const openPanel = () => {
    setForm(toForm(twin));
    setError(undefined);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);
    const result = await updateIdentityAction(startupId, {
      name: form.name.trim(),
      tagline: form.tagline.trim() || undefined,
      shortDescription: form.shortDescription.trim() || undefined,
      longDescription: form.longDescription.trim() || undefined,
      website: form.website.trim() || undefined,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      country: form.country.trim(),
      city: form.city.trim() || undefined,
      operatingCountries: toStringList(form.operatingCountries),
      industry: form.industry.trim() || undefined,
      subIndustry: form.subIndustry.trim() || undefined,
      stage: form.stage,
      preferredCurrency: form.preferredCurrency.trim(),
      registration: { status: form.registrationStatus },
    });
    setSaving(false);
    if (!result.ok) {
      setError(tc("submit") + ": " + result.error);
      return;
    }
    setOpen(false);
    onSaved();
  };

  const missingLabels = completion.missingItems.slice(0, 3).map((item) => tFields(item.fieldKey));

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("identityTitle")} editLabel={t("editProfile")} onEdit={openPanel}>
        <p className="mb-4 text-[15px] text-aff-muted">{identity.shortDescription || t("noDescription")}</p>
        <DetailRow label={t("stageLabel")} value={tStage(identity.stage)} />
        <DetailRow label={t("industryLabel")} value={identity.industry || "—"} />
        <DetailRow label={t("locationLabel")} value={[identity.city, identity.country].filter(Boolean).join(", ") || "—"} />
        <DetailRow label={t("operatingMarketsLabel")} value={identity.operatingCountries.join(", ") || "—"} />
        <DetailRow
          label={t("websiteLabel")}
          value={
            identity.website ? (
              <a href={identity.website} target="_blank" rel="noopener noreferrer" className="text-aff-accent">
                {identity.website}
              </a>
            ) : (
              "—"
            )
          }
        />
      </SectionCard>

      <SectionCard title={tp("title")} editLabel={tp("edit")} onEdit={openProblemPanel}>
        <DetailRow label={tp("field.statement")} value={problem.statement || "—"} />
        <DetailRow label={tp("field.targetCustomer")} value={problem.targetCustomer || "—"} />
        <DetailRow label={tp("field.currentAlternatives")} value={problem.currentAlternatives || "—"} />
        <DetailRow label={tp("field.painSeverity")} value={problem.painSeverity ? tSeverity(problem.painSeverity) : "—"} />
        <DetailRow label={tp("field.evidence")} value={problem.evidence || "—"} />
        <DetailRow label={tp("field.whyNow")} value={problem.whyNow || "—"} />
      </SectionCard>

      <SectionCard title={t("completionTitle")}>
        <ProfileCompletionBar pct={completion.overallPct} label={t("completionLabel")} />
      </SectionCard>

      <SectionCard title={t("missingTitle")}>
        <MissingInfoList
          title={t("missingCount", { count: completion.missingItems.length })}
          items={missingLabels}
          emptyLabel={t("missingEmpty")}
        />
      </SectionCard>

      <EditPanel
        open={open}
        title={t("editProfile")}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        saving={saving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={error}
      >
        <TextField id="id-name" label={t("field.name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <TextField id="id-tagline" label={t("field.tagline")} value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
        <TextAreaField id="id-short" label={t("field.shortDescription")} rows={2} value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} />
        <TextAreaField id="id-long" label={t("field.longDescription")} rows={4} value={form.longDescription} onChange={(e) => setForm((f) => ({ ...f, longDescription: e.target.value }))} />
        <TextField id="id-website" label={t("field.website")} type="url" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
        <TextField id="id-founded" label={t("field.foundedYear")} type="number" value={form.foundedYear} onChange={(e) => setForm((f) => ({ ...f, foundedYear: e.target.value }))} />
        <div className="flex gap-3">
          <div className="flex-1">
            <TextField id="id-country" label={t("field.country")} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </div>
          <div className="flex-1">
            <TextField id="id-city" label={t("field.city")} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
        </div>
        <TextField
          id="id-operating"
          label={t("field.operatingCountries")}
          placeholder={t("commaSeparated")}
          value={form.operatingCountries}
          onChange={(e) => setForm((f) => ({ ...f, operatingCountries: e.target.value }))}
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <TextField id="id-industry" label={t("field.industry")} value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
          </div>
          <div className="flex-1">
            <TextField id="id-subindustry" label={t("field.subIndustry")} value={form.subIndustry} onChange={(e) => setForm((f) => ({ ...f, subIndustry: e.target.value }))} />
          </div>
        </div>
        <SelectField id="id-stage" label={t("field.stage")} value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as StartupStage }))}>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {tStage(s)}
            </option>
          ))}
        </SelectField>
        <TextField id="id-currency" label={t("field.preferredCurrency")} value={form.preferredCurrency} onChange={(e) => setForm((f) => ({ ...f, preferredCurrency: e.target.value }))} />
        <SelectField
          id="id-registration"
          label={t("field.registrationStatus")}
          value={form.registrationStatus}
          onChange={(e) => setForm((f) => ({ ...f, registrationStatus: e.target.value as CompanyRegistrationStatus }))}
        >
          {REG_STATUSES.map((s) => (
            <option key={s} value={s}>
              {tReg(s)}
            </option>
          ))}
        </SelectField>
      </EditPanel>

      <EditPanel
        open={problemOpen}
        title={tp("edit")}
        onClose={() => setProblemOpen(false)}
        onSave={handleProblemSave}
        saving={problemSaving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={problemError}
      >
        <TextAreaField id="pb-statement" label={tp("field.statement")} rows={2} value={problemForm.statement} onChange={(e) => setProblemForm((f) => ({ ...f, statement: e.target.value }))} />
        <TextField id="pb-target" label={tp("field.targetCustomer")} value={problemForm.targetCustomer} onChange={(e) => setProblemForm((f) => ({ ...f, targetCustomer: e.target.value }))} />
        <TextAreaField id="pb-alt" label={tp("field.currentAlternatives")} rows={2} value={problemForm.currentAlternatives} onChange={(e) => setProblemForm((f) => ({ ...f, currentAlternatives: e.target.value }))} />
        <SelectField
          id="pb-severity"
          label={tp("field.painSeverity")}
          value={problemForm.painSeverity}
          onChange={(e) => setProblemForm((f) => ({ ...f, painSeverity: e.target.value as PainSeverity }))}
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {tSeverity(s)}
            </option>
          ))}
        </SelectField>
        <TextAreaField id="pb-evidence" label={tp("field.evidence")} rows={2} value={problemForm.evidence} onChange={(e) => setProblemForm((f) => ({ ...f, evidence: e.target.value }))} />
        <TextAreaField id="pb-whynow" label={tp("field.whyNow")} rows={2} value={problemForm.whyNow} onChange={(e) => setProblemForm((f) => ({ ...f, whyNow: e.target.value }))} />
      </EditPanel>
    </div>
  );
}
