"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, ItemCard } from "./shared";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { CheckboxField } from "@/components/forms/CheckboxField";
import {
  addTractionMetricAction,
  updateTractionMetricAction,
  removeTractionMetricAction,
  updateTractionAction,
} from "@/lib/actions/digital-twin";
import { toStringList } from "@/lib/validation";
import { formatNumber, formatMoney } from "@/lib/format";
import type { StartupTraction, TractionMetric, TractionMetricType } from "@/types/digital-twin";

const TYPES: TractionMetricType[] = [
  "customers",
  "active_customers",
  "users",
  "active_users",
  "mrr",
  "arr",
  "revenue",
  "revenue_growth",
  "gmv",
  "contracts",
  "pilots",
  "partnerships",
  "retention",
  "churn",
  "cac",
  "ltv",
  "custom",
];

const MONETARY_TYPES = new Set<TractionMetricType>(["mrr", "arr", "revenue", "gmv", "cac", "ltv"]);

const emptyMetric: Omit<TractionMetric, "id"> = {
  type: "customers",
  label: "",
  value: 0,
  date: new Date().toISOString().slice(0, 10),
  verified: false,
};

export function TractionTab({
  startupId,
  traction,
  onSaved,
}: {
  startupId: string;
  traction: StartupTraction;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.myStartup.traction");
  const tc = useTranslations("common");
  const tm = useTranslations("dashboard.myStartup.common");
  const tType = useTranslations("dashboard.digitalTwin.enums.tractionMetricType");
  const locale = useLocale();

  const [panel, setPanel] = useState<{ id: string | null; form: Omit<TractionMetric, "id"> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsForm, setDetailsForm] = useState(() => toDetailsForm(traction));

  function toDetailsForm(tr: StartupTraction) {
    return { narrative: tr.narrative ?? "", majorCustomers: tr.majorCustomers.join(", "), commercialEvidence: tr.commercialEvidence ?? "" };
  }

  const openAdd = () => setPanel({ id: null, form: emptyMetric });
  const openEdit = (m: TractionMetric) => setPanel({ id: m.id, form: m });

  const save = async () => {
    if (!panel) return;
    setSaving(true);
    setError(undefined);
    const result = panel.id
      ? await updateTractionMetricAction(startupId, panel.id, panel.form)
      : await addTractionMetricAction(startupId, panel.form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPanel(null);
    onSaved();
  };

  const remove = async (id: string) => {
    await removeTractionMetricAction(startupId, id);
    onSaved();
  };

  const openDetails = () => {
    setDetailsForm(toDetailsForm(traction));
    setDetailsOpen(true);
  };

  const saveDetails = async () => {
    setDetailsSaving(true);
    await updateTractionAction(startupId, {
      narrative: detailsForm.narrative.trim() || undefined,
      majorCustomers: toStringList(detailsForm.majorCustomers),
      commercialEvidence: detailsForm.commercialEvidence.trim() || undefined,
    });
    setDetailsSaving(false);
    setDetailsOpen(false);
    onSaved();
  };

  const displayValue = (m: TractionMetric) =>
    m.currency && MONETARY_TYPES.has(m.type) ? formatMoney(m.value, m.currency, locale) : `${formatNumber(m.value, locale)}${m.unit ? ` ${m.unit}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("metricsTitle")} editLabel={t("addMetric")} onEdit={openAdd}>
        {traction.metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {traction.metrics.map((m) => (
              <MetricCard key={m.id} label={m.label} value={displayValue(m)} hint={m.period} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("noMetrics")} body={t("noMetricsBody")} />
        )}

        {traction.metrics.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3">
            {traction.metrics.map((m) => (
              <ItemCard
                key={m.id}
                title={m.label}
                subtitle={`${tType(m.type)} · ${displayValue(m)}${m.verified ? ` · ${t("verified")}` : ""}`}
                onEdit={() => openEdit(m)}
                onRemove={() => remove(m.id)}
                editLabel={tm("edit")}
                removeLabel={tm("remove")}
              />
            ))}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={t("detailsTitle")} editLabel={tm("edit")} onEdit={openDetails}>
        <p className="mb-2 text-[14px] text-aff-text">{traction.narrative || "—"}</p>
        <p className="mb-2 text-[13px] text-aff-muted">
          {t("field.majorCustomers")}: {traction.majorCustomers.join(", ") || "—"}
        </p>
        <p className="text-[13px] text-aff-muted">
          {t("field.commercialEvidence")}: {traction.commercialEvidence || "—"}
        </p>
      </SectionCard>

      <EditPanel
        open={panel !== null}
        title={panel?.id ? t("editMetric") : t("addMetric")}
        onClose={() => setPanel(null)}
        onSave={save}
        saving={saving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={error}
      >
        {panel ? (
          <>
            <SelectField id="tr-type" label={t("field.type")} value={panel.form.type} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, type: e.target.value as TractionMetricType } })}>
              {TYPES.map((v) => (
                <option key={v} value={v}>
                  {tType(v)}
                </option>
              ))}
            </SelectField>
            <TextField id="tr-label" label={t("field.label")} value={panel.form.label} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, label: e.target.value } })} />
            <TextField id="tr-value" label={t("field.value")} type="number" value={panel.form.value} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, value: Number(e.target.value) } })} />
            <TextField id="tr-unit" label={t("field.unit")} value={panel.form.unit ?? ""} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, unit: e.target.value } })} />
            <TextField id="tr-currency" label={t("field.currency")} value={panel.form.currency ?? ""} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, currency: e.target.value } })} />
            <TextField id="tr-period" label={t("field.period")} value={panel.form.period ?? ""} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, period: e.target.value } })} />
            <TextField id="tr-date" label={t("field.date")} type="date" value={panel.form.date} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, date: e.target.value } })} />
            <TextField id="tr-source" label={t("field.source")} value={panel.form.source ?? ""} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, source: e.target.value } })} />
            <CheckboxField id="tr-verified" label={t("field.verified")} checked={panel.form.verified} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, verified: e.target.checked } })} />
          </>
        ) : null}
      </EditPanel>

      <EditPanel
        open={detailsOpen}
        title={t("detailsTitle")}
        onClose={() => setDetailsOpen(false)}
        onSave={saveDetails}
        saving={detailsSaving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
      >
        <TextAreaField id="tr-narrative" label={t("field.narrative")} rows={3} value={detailsForm.narrative} onChange={(e) => setDetailsForm((f) => ({ ...f, narrative: e.target.value }))} />
        <TextField id="tr-customers" label={t("field.majorCustomers")} placeholder={t("commaSeparated")} value={detailsForm.majorCustomers} onChange={(e) => setDetailsForm((f) => ({ ...f, majorCustomers: e.target.value }))} />
        <TextAreaField id="tr-evidence" label={t("field.commercialEvidence")} rows={2} value={detailsForm.commercialEvidence} onChange={(e) => setDetailsForm((f) => ({ ...f, commercialEvidence: e.target.value }))} />
      </EditPanel>
    </div>
  );
}
