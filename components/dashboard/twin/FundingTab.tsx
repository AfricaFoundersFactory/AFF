"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, DetailRow } from "./shared";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { updateFundingAction } from "@/lib/actions/digital-twin";
import { formatMoney } from "@/lib/format";
import type { StartupFunding, FundingStatus, FundingInstrument } from "@/types/digital-twin";
import type { MonetaryAmount } from "@/types/common";

const STATUSES: FundingStatus[] = ["not_raising", "raising", "closed"];
const INSTRUMENTS: FundingInstrument[] = ["equity", "safe", "convertible_note", "debt", "grant", "revenue_based_financing", "other"];

type AmountForm = { amount: string; currency: string };

function amountToForm(a?: MonetaryAmount): AmountForm {
  return { amount: a ? String(a.amount) : "", currency: a?.currency ?? "USD" };
}
function formToAmount(f: AmountForm): MonetaryAmount | undefined {
  if (!f.amount.trim()) return undefined;
  return { amount: Number(f.amount), currency: f.currency.trim() || "USD" };
}

export function FundingTab({ startupId, funding, onSaved }: { startupId: string; funding: StartupFunding; onSaved: () => void }) {
  const t = useTranslations("dashboard.myStartup.funding");
  const tc = useTranslations("common");
  const tStatus = useTranslations("dashboard.digitalTwin.enums.fundingStatus");
  const tInstrument = useTranslations("dashboard.digitalTwin.enums.fundingInstrument");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [form, setForm] = useState(() => toForm(funding));

  function toForm(f: StartupFunding) {
    return {
      status: f.status,
      totalRaised: amountToForm(f.totalRaised),
      currentRound: f.currentRound ?? "",
      targetRaise: amountToForm(f.targetRaise),
      minimumTicket: amountToForm(f.minimumTicket),
      maximumTicket: amountToForm(f.maximumTicket),
      valuation: amountToForm(f.valuation),
      instrument: f.instrument ?? "equity",
      useOfFunds: f.useOfFunds ?? "",
    };
  }

  const money = (a?: MonetaryAmount) => (a ? formatMoney(a.amount, a.currency, locale) : "—");

  const openPanel = () => {
    setForm(toForm(funding));
    setError(undefined);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateFundingAction(startupId, {
      status: form.status as FundingStatus,
      totalRaised: formToAmount(form.totalRaised),
      currentRound: form.currentRound.trim() || undefined,
      targetRaise: formToAmount(form.targetRaise),
      minimumTicket: formToAmount(form.minimumTicket),
      maximumTicket: formToAmount(form.maximumTicket),
      valuation: formToAmount(form.valuation),
      instrument: form.instrument as FundingInstrument,
      useOfFunds: form.useOfFunds.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    onSaved();
  };

  const amountFields = (key: "totalRaised" | "targetRaise" | "minimumTicket" | "maximumTicket" | "valuation") => (
    <div className="flex gap-3">
      <div className="flex-[2]">
        <TextField
          id={`fu-${key}-amount`}
          label={t(`field.${key}`)}
          type="number"
          value={form[key].amount}
          onChange={(e) => setForm((f) => ({ ...f, [key]: { ...f[key], amount: e.target.value } }))}
        />
      </div>
      <div className="flex-1">
        <TextField
          id={`fu-${key}-currency`}
          label={t("field.currency")}
          value={form[key].currency}
          onChange={(e) => setForm((f) => ({ ...f, [key]: { ...f[key], currency: e.target.value } }))}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("title")} editLabel={t("edit")} onEdit={openPanel}>
        <DetailRow label={t("field.status")} value={tStatus(funding.status)} />
        <DetailRow label={t("field.totalRaised")} value={money(funding.totalRaised)} />
        <DetailRow label={t("field.currentRound")} value={funding.currentRound || "—"} />
        <DetailRow label={t("field.targetRaise")} value={money(funding.targetRaise)} />
        <DetailRow label={t("field.instrument")} value={funding.instrument ? tInstrument(funding.instrument) : "—"} />
        <DetailRow label={t("field.useOfFunds")} value={funding.useOfFunds || "—"} />
        {funding.previousRounds.length > 0 ? (
          <DetailRow
            label={t("previousRounds")}
            value={funding.previousRounds.map((r) => `${r.roundType} (${money(r.amount)})`).join(", ")}
          />
        ) : null}
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
        <SelectField id="fu-status" label={t("field.status")} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FundingStatus }))}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </SelectField>
        {amountFields("totalRaised")}
        <TextField id="fu-round" label={t("field.currentRound")} value={form.currentRound} onChange={(e) => setForm((f) => ({ ...f, currentRound: e.target.value }))} />
        {amountFields("targetRaise")}
        {amountFields("minimumTicket")}
        {amountFields("maximumTicket")}
        {amountFields("valuation")}
        <SelectField id="fu-instrument" label={t("field.instrument")} value={form.instrument} onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value as FundingInstrument }))}>
          {INSTRUMENTS.map((i) => (
            <option key={i} value={i}>
              {tInstrument(i)}
            </option>
          ))}
        </SelectField>
        <TextAreaField id="fu-useoffunds" label={t("field.useOfFunds")} rows={3} value={form.useOfFunds} onChange={(e) => setForm((f) => ({ ...f, useOfFunds: e.target.value }))} />
      </EditPanel>
    </div>
  );
}
