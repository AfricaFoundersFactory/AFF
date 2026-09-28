"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, DetailRow } from "./shared";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { updateProductAction } from "@/lib/actions/digital-twin";
import { toStringList } from "@/lib/validation";
import type { StartupProduct, ProductType, DevelopmentStage } from "@/types/digital-twin";

const TYPES: ProductType[] = ["software", "hardware", "marketplace", "service", "hybrid", "other"];
const STAGES: DevelopmentStage[] = ["concept", "prototype", "mvp", "live", "scaling"];

export function ProductTab({
  startupId,
  product,
  onSaved,
}: {
  startupId: string;
  product: StartupProduct;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.myStartup.product");
  const tc = useTranslations("common");
  const tType = useTranslations("dashboard.digitalTwin.enums.productType");
  const tDev = useTranslations("dashboard.digitalTwin.enums.developmentStage");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [form, setForm] = useState(() => toForm(product));

  function toForm(p: StartupProduct) {
    return {
      name: p.name ?? "",
      type: p.type ?? "software",
      description: p.description ?? "",
      developmentStage: p.developmentStage ?? "concept",
      valueProposition: p.valueProposition ?? "",
      coreFeatures: p.coreFeatures.join(", "),
      technology: p.technology ?? "",
      launched: p.launched,
      launchDate: p.launchDate ?? "",
      demoUrl: p.demoUrl ?? "",
    };
  }

  const openPanel = () => {
    setForm(toForm(product));
    setError(undefined);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProductAction(startupId, {
      name: form.name.trim() || undefined,
      type: form.type as ProductType,
      description: form.description.trim() || undefined,
      developmentStage: form.developmentStage as DevelopmentStage,
      valueProposition: form.valueProposition.trim() || undefined,
      coreFeatures: toStringList(form.coreFeatures),
      technology: form.technology.trim() || undefined,
      launched: form.launched,
      launchDate: form.launchDate.trim() || undefined,
      demoUrl: form.demoUrl.trim() || undefined,
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
        <p className="mb-4 text-[15px] text-aff-muted">{product.description || t("noDescription")}</p>
        <DetailRow label={t("field.name")} value={product.name || "—"} />
        <DetailRow label={t("field.type")} value={product.type ? tType(product.type) : "—"} />
        <DetailRow label={t("field.developmentStage")} value={product.developmentStage ? tDev(product.developmentStage) : "—"} />
        <DetailRow label={t("field.valueProposition")} value={product.valueProposition || "—"} />
        <DetailRow label={t("field.coreFeatures")} value={product.coreFeatures.join(", ") || "—"} />
        <DetailRow label={t("field.launched")} value={product.launched ? t("yes") : t("no")} />
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
        <TextField id="pr-name" label={t("field.name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <SelectField id="pr-type" label={t("field.type")} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProductType }))}>
          {TYPES.map((v) => (
            <option key={v} value={v}>
              {tType(v)}
            </option>
          ))}
        </SelectField>
        <TextAreaField id="pr-desc" label={t("field.description")} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <SelectField id="pr-stage" label={t("field.developmentStage")} value={form.developmentStage} onChange={(e) => setForm((f) => ({ ...f, developmentStage: e.target.value as DevelopmentStage }))}>
          {STAGES.map((v) => (
            <option key={v} value={v}>
              {tDev(v)}
            </option>
          ))}
        </SelectField>
        <TextAreaField id="pr-vp" label={t("field.valueProposition")} rows={2} value={form.valueProposition} onChange={(e) => setForm((f) => ({ ...f, valueProposition: e.target.value }))} />
        <TextField id="pr-features" label={t("field.coreFeatures")} placeholder={t("commaSeparated")} value={form.coreFeatures} onChange={(e) => setForm((f) => ({ ...f, coreFeatures: e.target.value }))} />
        <TextField id="pr-tech" label={t("field.technology")} value={form.technology} onChange={(e) => setForm((f) => ({ ...f, technology: e.target.value }))} />
        <CheckboxField id="pr-launched" label={t("field.launched")} checked={form.launched} onChange={(e) => setForm((f) => ({ ...f, launched: e.target.checked }))} />
        <TextField id="pr-launchdate" label={t("field.launchDate")} type="date" value={form.launchDate} onChange={(e) => setForm((f) => ({ ...f, launchDate: e.target.value }))} />
        <TextField id="pr-demo" label={t("field.demoUrl")} type="url" value={form.demoUrl} onChange={(e) => setForm((f) => ({ ...f, demoUrl: e.target.value }))} />
      </EditPanel>
    </div>
  );
}
