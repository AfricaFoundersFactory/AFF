"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, DetailRow } from "./shared";
import { TextField } from "@/components/forms/TextField";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { updateBusinessModelAction } from "@/lib/actions/digital-twin";
import { toStringList } from "@/lib/validation";
import type { StartupBusinessModel, BusinessModelType } from "@/types/digital-twin";

const TYPES: BusinessModelType[] = [
  "b2b",
  "b2c",
  "b2b2c",
  "marketplace",
  "saas",
  "subscription",
  "transactional",
  "licensing",
  "other",
];

export function BusinessTab({
  startupId,
  businessModel,
  onSaved,
}: {
  startupId: string;
  businessModel: StartupBusinessModel;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.myStartup.business");
  const tc = useTranslations("common");
  const tType = useTranslations("dashboard.digitalTwin.enums.businessModelType");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [form, setForm] = useState(() => toForm(businessModel));

  function toForm(b: StartupBusinessModel) {
    return {
      types: b.types,
      revenueStreams: b.revenueStreams.map((r) => r.label).join(", "),
      pricingModel: b.pricingModel ?? "",
      salesChannels: b.salesChannels.join(", "),
      salesCycle: b.salesCycle ?? "",
      distributionModel: b.distributionModel ?? "",
      keyPartnerships: b.keyPartnerships.join(", "),
    };
  }

  const openPanel = () => {
    setForm(toForm(businessModel));
    setError(undefined);
    setOpen(true);
  };

  const toggleType = (type: BusinessModelType) => {
    setForm((f) => ({
      ...f,
      types: f.types.includes(type) ? f.types.filter((v) => v !== type) : [...f.types, type],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateBusinessModelAction(startupId, {
      types: form.types,
      revenueStreams: toStringList(form.revenueStreams).map((label, i) => ({
        id: businessModel.revenueStreams[i]?.id ?? `${Date.now()}-${i}`,
        label,
      })),
      pricingModel: form.pricingModel.trim() || undefined,
      salesChannels: toStringList(form.salesChannels),
      salesCycle: form.salesCycle.trim() || undefined,
      distributionModel: form.distributionModel.trim() || undefined,
      keyPartnerships: toStringList(form.keyPartnerships),
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
        <DetailRow label={t("field.types")} value={businessModel.types.map((v) => tType(v)).join(", ") || "—"} />
        <DetailRow label={t("field.revenueStreams")} value={businessModel.revenueStreams.map((r) => r.label).join(", ") || "—"} />
        <DetailRow label={t("field.pricingModel")} value={businessModel.pricingModel || "—"} />
        <DetailRow label={t("field.salesChannels")} value={businessModel.salesChannels.join(", ") || "—"} />
        <DetailRow label={t("field.salesCycle")} value={businessModel.salesCycle || "—"} />
        <DetailRow label={t("field.distributionModel")} value={businessModel.distributionModel || "—"} />
        <DetailRow label={t("field.keyPartnerships")} value={businessModel.keyPartnerships.join(", ") || "—"} />
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
        <div>
          <div className="mb-2 text-[13px] font-semibold text-aff-muted">{t("field.types")}</div>
          <div className="flex flex-col gap-2">
            {TYPES.map((type) => (
              <CheckboxField
                key={type}
                id={`bm-type-${type}`}
                label={tType(type)}
                checked={form.types.includes(type)}
                onChange={() => toggleType(type)}
              />
            ))}
          </div>
        </div>
        <TextField id="bm-revenue" label={t("field.revenueStreams")} placeholder={t("commaSeparated")} value={form.revenueStreams} onChange={(e) => setForm((f) => ({ ...f, revenueStreams: e.target.value }))} />
        <TextField id="bm-pricing" label={t("field.pricingModel")} value={form.pricingModel} onChange={(e) => setForm((f) => ({ ...f, pricingModel: e.target.value }))} />
        <TextField id="bm-channels" label={t("field.salesChannels")} placeholder={t("commaSeparated")} value={form.salesChannels} onChange={(e) => setForm((f) => ({ ...f, salesChannels: e.target.value }))} />
        <TextField id="bm-cycle" label={t("field.salesCycle")} value={form.salesCycle} onChange={(e) => setForm((f) => ({ ...f, salesCycle: e.target.value }))} />
        <TextField id="bm-distribution" label={t("field.distributionModel")} value={form.distributionModel} onChange={(e) => setForm((f) => ({ ...f, distributionModel: e.target.value }))} />
        <TextField id="bm-partnerships" label={t("field.keyPartnerships")} placeholder={t("commaSeparated")} value={form.keyPartnerships} onChange={(e) => setForm((f) => ({ ...f, keyPartnerships: e.target.value }))} />
      </EditPanel>
    </div>
  );
}
