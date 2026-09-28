"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, DetailRow } from "./shared";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { updateMarketAction } from "@/lib/actions/digital-twin";
import { toStringList } from "@/lib/validation";
import { formatMoney } from "@/lib/format";
import type { StartupMarket, MarketSizeEstimate } from "@/types/digital-twin";

type SizeForm = { amount: string; currency: string; methodology: string };

function sizeToForm(s?: MarketSizeEstimate): SizeForm {
  return { amount: s ? String(s.amount.amount) : "", currency: s?.amount.currency ?? "USD", methodology: s?.methodology ?? "" };
}

function formToSize(f: SizeForm): MarketSizeEstimate | undefined {
  if (!f.amount.trim()) return undefined;
  return { amount: { amount: Number(f.amount), currency: f.currency.trim() || "USD" }, methodology: f.methodology.trim() || undefined };
}

function sizeSummary(s: MarketSizeEstimate | undefined, locale: string): string {
  if (!s) return "—";
  const amount = formatMoney(s.amount.amount, s.amount.currency, locale);
  return s.methodology ? `${amount} — ${s.methodology}` : amount;
}

export function MarketTab({ startupId, market, onSaved }: { startupId: string; market: StartupMarket; onSaved: () => void }) {
  const t = useTranslations("dashboard.myStartup.market");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [form, setForm] = useState(() => toForm(market));

  function toForm(m: StartupMarket) {
    return {
      customerSegments: m.customerSegments.join(", "),
      geographies: m.geographies.join(", "),
      tam: sizeToForm(m.tam),
      sam: sizeToForm(m.sam),
      som: sizeToForm(m.som),
      trends: m.trends ?? "",
      competitors: m.competitors.map((c) => c.name).join(", "),
      competitiveAdvantage: m.competitiveAdvantage ?? "",
    };
  }

  const openPanel = () => {
    setForm(toForm(market));
    setError(undefined);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateMarketAction(startupId, {
      customerSegments: toStringList(form.customerSegments),
      geographies: toStringList(form.geographies),
      tam: formToSize(form.tam),
      sam: formToSize(form.sam),
      som: formToSize(form.som),
      trends: form.trends.trim() || undefined,
      competitors: toStringList(form.competitors).map((name, i) => ({ id: market.competitors[i]?.id ?? `${Date.now()}-${i}`, name })),
      competitiveAdvantage: form.competitiveAdvantage.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    onSaved();
  };

  const sizeFields = (key: "tam" | "sam" | "som") => (
    <div className="flex gap-3">
      <div className="flex-[2]">
        <TextField
          id={`mk-${key}-amount`}
          label={t(`field.${key}`)}
          type="number"
          value={form[key].amount}
          onChange={(e) => setForm((f) => ({ ...f, [key]: { ...f[key], amount: e.target.value } }))}
        />
      </div>
      <div className="flex-1">
        <TextField
          id={`mk-${key}-currency`}
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
        <DetailRow label={t("field.customerSegments")} value={market.customerSegments.join(", ") || "—"} />
        <DetailRow label={t("field.geographies")} value={market.geographies.join(", ") || "—"} />
        <DetailRow label={t("field.tam")} value={sizeSummary(market.tam, locale)} />
        <DetailRow label={t("field.sam")} value={sizeSummary(market.sam, locale)} />
        <DetailRow label={t("field.som")} value={sizeSummary(market.som, locale)} />
        <DetailRow label={t("field.competitors")} value={market.competitors.map((c) => c.name).join(", ") || "—"} />
        <DetailRow label={t("field.competitiveAdvantage")} value={market.competitiveAdvantage || "—"} />
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
        <TextField id="mk-segments" label={t("field.customerSegments")} placeholder={t("commaSeparated")} value={form.customerSegments} onChange={(e) => setForm((f) => ({ ...f, customerSegments: e.target.value }))} />
        <TextField id="mk-geo" label={t("field.geographies")} placeholder={t("commaSeparated")} value={form.geographies} onChange={(e) => setForm((f) => ({ ...f, geographies: e.target.value }))} />
        {sizeFields("tam")}
        <TextField id="mk-tam-method" label={t("field.methodology")} value={form.tam.methodology} onChange={(e) => setForm((f) => ({ ...f, tam: { ...f.tam, methodology: e.target.value } }))} />
        {sizeFields("sam")}
        <TextField id="mk-sam-method" label={t("field.methodology")} value={form.sam.methodology} onChange={(e) => setForm((f) => ({ ...f, sam: { ...f.sam, methodology: e.target.value } }))} />
        {sizeFields("som")}
        <TextField id="mk-som-method" label={t("field.methodology")} value={form.som.methodology} onChange={(e) => setForm((f) => ({ ...f, som: { ...f.som, methodology: e.target.value } }))} />
        <TextAreaField id="mk-trends" label={t("field.trends")} rows={2} value={form.trends} onChange={(e) => setForm((f) => ({ ...f, trends: e.target.value }))} />
        <TextField id="mk-competitors" label={t("field.competitors")} placeholder={t("commaSeparated")} value={form.competitors} onChange={(e) => setForm((f) => ({ ...f, competitors: e.target.value }))} />
        <TextAreaField id="mk-advantage" label={t("field.competitiveAdvantage")} rows={2} value={form.competitiveAdvantage} onChange={(e) => setForm((f) => ({ ...f, competitiveAdvantage: e.target.value }))} />
      </EditPanel>
    </div>
  );
}
