"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, ItemCard } from "./shared";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { addMilestoneAction, updateMilestoneAction, removeMilestoneAction } from "@/lib/actions/digital-twin";
import type { StartupMilestone, MilestoneCategory, StartupMilestoneStatus } from "@/types/digital-twin";

const CATEGORIES: MilestoneCategory[] = ["company", "product", "traction", "funding", "team", "legal", "other"];
const STATUSES: StartupMilestoneStatus[] = ["planned", "achieved"];

const emptyMilestone: Omit<StartupMilestone, "id"> = {
  title: "",
  date: new Date().toISOString().slice(0, 10),
  category: "company",
  status: "achieved",
};

export function MilestonesTab({
  startupId,
  milestones,
  onSaved,
}: {
  startupId: string;
  milestones: StartupMilestone[];
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.myStartup.milestones");
  const tc = useTranslations("common");
  const tm = useTranslations("dashboard.myStartup.common");
  const tCat = useTranslations("dashboard.digitalTwin.enums.milestoneCategory");
  const tStatus = useTranslations("dashboard.digitalTwin.enums.milestoneStatus");

  const [panel, setPanel] = useState<{ id: string | null; form: Omit<StartupMilestone, "id"> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const save = async () => {
    if (!panel) return;
    setSaving(true);
    setError(undefined);
    const result = panel.id
      ? await updateMilestoneAction(startupId, panel.id, panel.form)
      : await addMilestoneAction(startupId, panel.form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPanel(null);
    onSaved();
  };

  const remove = async (id: string) => {
    await removeMilestoneAction(startupId, id);
    onSaved();
  };

  const sorted = [...milestones].sort((a, b) => a.date.localeCompare(b.date));
  const byYear = sorted.reduce<Record<string, StartupMilestone[]>>((acc, m) => {
    const year = m.date.slice(0, 4);
    (acc[year] ??= []).push(m);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort();

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("title")} editLabel={t("addMilestone")} onEdit={() => setPanel({ id: null, form: emptyMilestone })}>
        {years.length > 0 ? (
          <div className="flex flex-col gap-6">
            {years.map((year) => (
              <div key={year}>
                <div className="mb-3 font-heading text-sm font-semibold text-aff-muted">{year}</div>
                <div className="flex flex-col gap-3 border-l border-aff-line pl-4">
                  {byYear[year].map((m) => (
                    <ItemCard
                      key={m.id}
                      title={m.title}
                      subtitle={`${tCat(m.category)} · ${tStatus(m.status)} · ${m.date}`}
                      onEdit={() => setPanel({ id: m.id, form: m })}
                      onRemove={() => remove(m.id)}
                      editLabel={tm("edit")}
                      removeLabel={tm("remove")}
                    >
                      {m.description ? <p className="mt-2 text-[12.5px] text-aff-muted">{m.description}</p> : null}
                    </ItemCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t("noMilestones")} body={t("noMilestonesBody")} />
        )}
      </SectionCard>

      <EditPanel
        open={panel !== null}
        title={panel?.id ? t("editMilestone") : t("addMilestone")}
        onClose={() => setPanel(null)}
        onSave={save}
        saving={saving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={error}
      >
        {panel ? (
          <>
            <TextField id="ms-title" label={t("field.title")} value={panel.form.title} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, title: e.target.value } })} />
            <TextAreaField id="ms-desc" label={t("field.description")} rows={2} value={panel.form.description ?? ""} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, description: e.target.value } })} />
            <TextField id="ms-date" label={t("field.date")} type="date" value={panel.form.date} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, date: e.target.value } })} />
            <SelectField id="ms-cat" label={t("field.category")} value={panel.form.category} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, category: e.target.value as MilestoneCategory } })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tCat(c)}
                </option>
              ))}
            </SelectField>
            <SelectField id="ms-status" label={t("field.status")} value={panel.form.status} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, status: e.target.value as StartupMilestoneStatus } })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {tStatus(s)}
                </option>
              ))}
            </SelectField>
            <TextField id="ms-evidence" label={t("field.evidenceUrl")} type="url" value={panel.form.evidenceUrl ?? ""} onChange={(e) => setPanel((p) => p && { ...p, form: { ...p.form, evidenceUrl: e.target.value } })} />
          </>
        ) : null}
      </EditPanel>
    </div>
  );
}
