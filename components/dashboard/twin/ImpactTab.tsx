"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, DetailRow } from "./shared";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { updateImpactAction } from "@/lib/actions/digital-twin";
import { toStringList } from "@/lib/validation";
import type { StartupImpact } from "@/types/digital-twin";

export function ImpactTab({ startupId, impact, onSaved }: { startupId: string; impact: StartupImpact; onSaved: () => void }) {
  const t = useTranslations("dashboard.myStartup.impact");
  const tc = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [form, setForm] = useState(() => toForm(impact));

  function toForm(im: StartupImpact) {
    return {
      enabled: im.enabled,
      thesis: im.thesis ?? "",
      sdgs: im.sdgs.join(", "),
      beneficiaries: im.beneficiaries != null ? String(im.beneficiaries) : "",
      jobsCreated: im.jobsCreated != null ? String(im.jobsCreated) : "",
      womenBeneficiariesPct: im.womenBeneficiariesPct != null ? String(im.womenBeneficiariesPct) : "",
      youthBeneficiariesPct: im.youthBeneficiariesPct != null ? String(im.youthBeneficiariesPct) : "",
      environmentalImpact: im.environmentalImpact ?? "",
      socialImpact: im.socialImpact ?? "",
    };
  }

  const openPanel = () => {
    setForm(toForm(impact));
    setError(undefined);
    setOpen(true);
  };

  const num = (v: string) => (v.trim() ? Number(v) : undefined);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateImpactAction(startupId, {
      enabled: form.enabled,
      thesis: form.thesis.trim() || undefined,
      sdgs: toStringList(form.sdgs),
      beneficiaries: num(form.beneficiaries),
      jobsCreated: num(form.jobsCreated),
      womenBeneficiariesPct: num(form.womenBeneficiariesPct),
      youthBeneficiariesPct: num(form.youthBeneficiariesPct),
      environmentalImpact: form.environmentalImpact.trim() || undefined,
      socialImpact: form.socialImpact.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    onSaved();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("title")} editLabel={t("edit")} onEdit={openPanel}>
        {impact.enabled ? (
          <>
            <DetailRow label={t("field.thesis")} value={impact.thesis || "—"} />
            <DetailRow label={t("field.sdgs")} value={impact.sdgs.join(", ") || "—"} />
            <DetailRow label={t("field.beneficiaries")} value={impact.beneficiaries ?? "—"} />
            <DetailRow label={t("field.jobsCreated")} value={impact.jobsCreated ?? "—"} />
            <DetailRow label={t("field.womenBeneficiariesPct")} value={impact.womenBeneficiariesPct != null ? `${impact.womenBeneficiariesPct}%` : "—"} />
            <DetailRow label={t("field.youthBeneficiariesPct")} value={impact.youthBeneficiariesPct != null ? `${impact.youthBeneficiariesPct}%` : "—"} />
            <DetailRow label={t("field.environmentalImpact")} value={impact.environmentalImpact || "—"} />
            <DetailRow label={t("field.socialImpact")} value={impact.socialImpact || "—"} />
          </>
        ) : (
          <p className="text-[14.5px] text-aff-muted">{t("notTracked")}</p>
        )}
      </SectionCard>

      <EditPanel
        open={open}
        title={t("edit")}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        saving={saving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={error}
      >
        <CheckboxField id="im-enabled" label={t("trackImpact")} checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
        {!form.enabled ? <p className="text-[13px] text-aff-muted">{t("notTrackedHint")}</p> : null}
        {form.enabled ? (
          <>
            <TextAreaField id="im-thesis" label={t("field.thesis")} rows={2} value={form.thesis} onChange={(e) => setForm((f) => ({ ...f, thesis: e.target.value }))} />
            <TextField id="im-sdgs" label={t("field.sdgs")} placeholder={t("commaSeparated")} value={form.sdgs} onChange={(e) => setForm((f) => ({ ...f, sdgs: e.target.value }))} />
            <TextField id="im-beneficiaries" label={t("field.beneficiaries")} type="number" value={form.beneficiaries} onChange={(e) => setForm((f) => ({ ...f, beneficiaries: e.target.value }))} />
            <TextField id="im-jobs" label={t("field.jobsCreated")} type="number" value={form.jobsCreated} onChange={(e) => setForm((f) => ({ ...f, jobsCreated: e.target.value }))} />
            <TextField id="im-women" label={t("field.womenBeneficiariesPct")} type="number" min={0} max={100} value={form.womenBeneficiariesPct} onChange={(e) => setForm((f) => ({ ...f, womenBeneficiariesPct: e.target.value }))} />
            <TextField id="im-youth" label={t("field.youthBeneficiariesPct")} type="number" min={0} max={100} value={form.youthBeneficiariesPct} onChange={(e) => setForm((f) => ({ ...f, youthBeneficiariesPct: e.target.value }))} />
            <TextAreaField id="im-env" label={t("field.environmentalImpact")} rows={2} value={form.environmentalImpact} onChange={(e) => setForm((f) => ({ ...f, environmentalImpact: e.target.value }))} />
            <TextAreaField id="im-social" label={t("field.socialImpact")} rows={2} value={form.socialImpact} onChange={(e) => setForm((f) => ({ ...f, socialImpact: e.target.value }))} />
          </>
        ) : null}
      </EditPanel>
    </div>
  );
}
