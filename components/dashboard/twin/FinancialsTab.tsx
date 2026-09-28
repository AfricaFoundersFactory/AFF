"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, DetailRow } from "./shared";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { updateFinancialsAction } from "@/lib/actions/digital-twin";
import { formatMoney } from "@/lib/format";
import type { StartupFinancials } from "@/types/digital-twin";

const unknown_ = "unknown";

export function FinancialsTab({
  startupId,
  financials,
  onSaved,
}: {
  startupId: string;
  financials: StartupFinancials;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.myStartup.financials");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [form, setForm] = useState(() => toForm(financials));

  function toForm(f: StartupFinancials) {
    return {
      currency: f.currency,
      annualRevenue: f.annualRevenue != null ? String(f.annualRevenue) : "",
      monthlyRevenue: f.monthlyRevenue != null ? String(f.monthlyRevenue) : "",
      monthlyExpenses: f.monthlyExpenses != null ? String(f.monthlyExpenses) : "",
      monthlyBurn: f.monthlyBurn != null ? String(f.monthlyBurn) : "",
      cashBalance: f.cashBalance != null ? String(f.cashBalance) : "",
      runwayMonths: f.runwayMonths != null ? String(f.runwayMonths) : "",
      profitable: f.profitable === undefined ? unknown_ : String(f.profitable),
      financialYear: f.financialYear != null ? String(f.financialYear) : "",
      notes: f.notes ?? "",
    };
  }

  const money = (v?: number) => (v != null ? formatMoney(v, financials.currency, locale) : "—");

  const openPanel = () => {
    setForm(toForm(financials));
    setError(undefined);
    setOpen(true);
  };

  const num = (v: string) => (v.trim() ? Number(v) : undefined);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateFinancialsAction(startupId, {
      currency: form.currency.trim() || "USD",
      annualRevenue: num(form.annualRevenue),
      monthlyRevenue: num(form.monthlyRevenue),
      monthlyExpenses: num(form.monthlyExpenses),
      monthlyBurn: num(form.monthlyBurn),
      cashBalance: num(form.cashBalance),
      runwayMonths: num(form.runwayMonths),
      profitable: form.profitable === unknown_ ? undefined : form.profitable === "true",
      financialYear: num(form.financialYear),
      notes: form.notes.trim() || undefined,
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
        <DetailRow label={t("field.monthlyRevenue")} value={money(financials.monthlyRevenue)} />
        <DetailRow label={t("field.monthlyExpenses")} value={money(financials.monthlyExpenses)} />
        <DetailRow label={t("field.monthlyBurn")} value={money(financials.monthlyBurn)} />
        <DetailRow label={t("field.cashBalance")} value={money(financials.cashBalance)} />
        <DetailRow label={t("field.runwayMonths")} value={financials.runwayMonths != null ? `${financials.runwayMonths} ${t("months")}` : "—"} />
        <DetailRow label={t("field.profitable")} value={financials.profitable === undefined ? t("unknown") : financials.profitable ? t("yes") : t("no")} />
        <DetailRow label={t("field.notes")} value={financials.notes || "—"} />
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
        <TextField id="fn-currency" label={t("field.currency")} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
        <TextField id="fn-annual" label={t("field.annualRevenue")} type="number" value={form.annualRevenue} onChange={(e) => setForm((f) => ({ ...f, annualRevenue: e.target.value }))} />
        <TextField id="fn-monthly-rev" label={t("field.monthlyRevenue")} type="number" value={form.monthlyRevenue} onChange={(e) => setForm((f) => ({ ...f, monthlyRevenue: e.target.value }))} />
        <TextField id="fn-monthly-exp" label={t("field.monthlyExpenses")} type="number" value={form.monthlyExpenses} onChange={(e) => setForm((f) => ({ ...f, monthlyExpenses: e.target.value }))} />
        <TextField id="fn-burn" label={t("field.monthlyBurn")} type="number" value={form.monthlyBurn} onChange={(e) => setForm((f) => ({ ...f, monthlyBurn: e.target.value }))} />
        <TextField id="fn-cash" label={t("field.cashBalance")} type="number" value={form.cashBalance} onChange={(e) => setForm((f) => ({ ...f, cashBalance: e.target.value }))} />
        <TextField id="fn-runway" label={t("field.runwayMonths")} type="number" value={form.runwayMonths} onChange={(e) => setForm((f) => ({ ...f, runwayMonths: e.target.value }))} />
        <SelectField id="fn-profitable" label={t("field.profitable")} value={form.profitable} onChange={(e) => setForm((f) => ({ ...f, profitable: e.target.value }))}>
          <option value={unknown_}>{t("dontKnowYet")}</option>
          <option value="true">{t("yes")}</option>
          <option value="false">{t("no")}</option>
        </SelectField>
        <TextField id="fn-year" label={t("field.financialYear")} type="number" value={form.financialYear} onChange={(e) => setForm((f) => ({ ...f, financialYear: e.target.value }))} />
        <TextAreaField id="fn-notes" label={t("field.notes")} rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </EditPanel>
    </div>
  );
}
