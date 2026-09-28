"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, ItemCard } from "./shared";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import {
  addGoalAction,
  updateGoalAction,
  removeGoalAction,
  addRiskAction,
  updateRiskAction,
  removeRiskAction,
} from "@/lib/actions/digital-twin";
import type { StartupGoal, StartupRisk, GoalCategory, GoalStatus, RiskCategory, RiskLevel, RiskStatus } from "@/types/digital-twin";

const GOAL_CATEGORIES: GoalCategory[] = ["growth", "product", "fundraising", "market", "team", "other"];
const GOAL_STATUSES: GoalStatus[] = ["not_started", "in_progress", "achieved", "missed"];
const RISK_CATEGORIES: RiskCategory[] = [
  "market",
  "product",
  "technology",
  "financial",
  "legal",
  "team",
  "operations",
  "fundraising",
  "regulatory",
  "other",
];
const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];
const RISK_STATUSES: RiskStatus[] = ["open", "mitigated", "accepted", "closed"];

const emptyGoal: Omit<StartupGoal, "id"> = { title: "", category: "growth", status: "not_started", progressPct: 0 };
const emptyRisk: Omit<StartupRisk, "id"> = { title: "", category: "market", probability: "medium", impact: "medium", status: "open" };

export function GoalsRisksTab({
  startupId,
  goals,
  risks,
  onSaved,
}: {
  startupId: string;
  goals: StartupGoal[];
  risks: StartupRisk[];
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.myStartup.goalsRisks");
  const tc = useTranslations("common");
  const tm = useTranslations("dashboard.myStartup.common");
  const tGoalCat = useTranslations("dashboard.digitalTwin.enums.goalCategory");
  const tGoalStatus = useTranslations("dashboard.digitalTwin.enums.goalStatus");
  const tRiskCat = useTranslations("dashboard.digitalTwin.enums.riskCategory");
  const tRiskLevel = useTranslations("dashboard.digitalTwin.enums.riskLevel");
  const tRiskStatus = useTranslations("dashboard.digitalTwin.enums.riskStatus");

  const [goalPanel, setGoalPanel] = useState<{ id: string | null; form: Omit<StartupGoal, "id"> } | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState<string | undefined>();

  const [riskPanel, setRiskPanel] = useState<{ id: string | null; form: Omit<StartupRisk, "id"> } | null>(null);
  const [riskSaving, setRiskSaving] = useState(false);
  const [riskError, setRiskError] = useState<string | undefined>();

  const saveGoal = async () => {
    if (!goalPanel) return;
    setGoalSaving(true);
    setGoalError(undefined);
    const result = goalPanel.id
      ? await updateGoalAction(startupId, goalPanel.id, goalPanel.form)
      : await addGoalAction(startupId, goalPanel.form);
    setGoalSaving(false);
    if (!result.ok) {
      setGoalError(result.error);
      return;
    }
    setGoalPanel(null);
    onSaved();
  };

  const removeGoalItem = async (id: string) => {
    await removeGoalAction(startupId, id);
    onSaved();
  };

  const saveRisk = async () => {
    if (!riskPanel) return;
    setRiskSaving(true);
    setRiskError(undefined);
    const result = riskPanel.id
      ? await updateRiskAction(startupId, riskPanel.id, riskPanel.form)
      : await addRiskAction(startupId, riskPanel.form);
    setRiskSaving(false);
    if (!result.ok) {
      setRiskError(result.error);
      return;
    }
    setRiskPanel(null);
    onSaved();
  };

  const removeRiskItem = async (id: string) => {
    await removeRiskAction(startupId, id);
    onSaved();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("goalsTitle")} editLabel={t("addGoal")} onEdit={() => setGoalPanel({ id: null, form: emptyGoal })}>
        {goals.length > 0 ? (
          <div className="flex flex-col gap-3">
            {goals.map((g) => (
              <ItemCard
                key={g.id}
                title={g.title}
                subtitle={`${tGoalCat(g.category)} · ${tGoalStatus(g.status)} · ${g.progressPct}%${g.targetDate ? ` · ${g.targetDate}` : ""}`}
                onEdit={() => setGoalPanel({ id: g.id, form: g })}
                onRemove={() => removeGoalItem(g.id)}
                editLabel={tm("edit")}
                removeLabel={tm("remove")}
              >
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-aff-line/50">
                  <div className="h-full rounded-full bg-aff-accent" style={{ width: `${Math.min(100, Math.max(0, g.progressPct))}%` }} />
                </div>
              </ItemCard>
            ))}
          </div>
        ) : (
          <EmptyState title={t("noGoals")} body={t("noGoalsBody")} />
        )}
      </SectionCard>

      <SectionCard title={t("risksTitle")} editLabel={t("addRisk")} onEdit={() => setRiskPanel({ id: null, form: emptyRisk })}>
        {risks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {risks.map((r) => (
              <ItemCard
                key={r.id}
                title={r.title}
                subtitle={`${tRiskCat(r.category)} · ${t("probability")}: ${tRiskLevel(r.probability)} · ${t("impact")}: ${tRiskLevel(r.impact)} · ${tRiskStatus(r.status)}`}
                onEdit={() => setRiskPanel({ id: r.id, form: r })}
                onRemove={() => removeRiskItem(r.id)}
                editLabel={tm("edit")}
                removeLabel={tm("remove")}
              >
                {r.mitigation ? <p className="mt-2 text-[12.5px] text-aff-muted">{r.mitigation}</p> : null}
              </ItemCard>
            ))}
          </div>
        ) : (
          <EmptyState title={t("noRisks")} body={t("noRisksBody")} />
        )}
      </SectionCard>

      <EditPanel
        open={goalPanel !== null}
        title={goalPanel?.id ? t("editGoal") : t("addGoal")}
        onClose={() => setGoalPanel(null)}
        onSave={saveGoal}
        saving={goalSaving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={goalError}
      >
        {goalPanel ? (
          <>
            <TextField id="gl-title" label={t("field.title")} value={goalPanel.form.title} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, title: e.target.value } })} />
            <TextAreaField id="gl-desc" label={t("field.description")} rows={2} value={goalPanel.form.description ?? ""} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, description: e.target.value } })} />
            <SelectField id="gl-cat" label={t("field.category")} value={goalPanel.form.category} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, category: e.target.value as GoalCategory } })}>
              {GOAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tGoalCat(c)}
                </option>
              ))}
            </SelectField>
            <TextField id="gl-target-date" label={t("field.targetDate")} type="date" value={goalPanel.form.targetDate ?? ""} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, targetDate: e.target.value } })} />
            <SelectField id="gl-status" label={t("field.status")} value={goalPanel.form.status} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, status: e.target.value as GoalStatus } })}>
              {GOAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {tGoalStatus(s)}
                </option>
              ))}
            </SelectField>
            <TextField id="gl-progress" label={t("field.progressPct")} type="number" min={0} max={100} value={goalPanel.form.progressPct} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, progressPct: Number(e.target.value) } })} />
            <div className="flex gap-3">
              <div className="flex-1">
                <TextField id="gl-target-value" label={t("field.targetValue")} type="number" value={goalPanel.form.targetValue ?? ""} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, targetValue: e.target.value ? Number(e.target.value) : undefined } })} />
              </div>
              <div className="flex-1">
                <TextField id="gl-current-value" label={t("field.currentValue")} type="number" value={goalPanel.form.currentValue ?? ""} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, currentValue: e.target.value ? Number(e.target.value) : undefined } })} />
              </div>
            </div>
            <TextField id="gl-unit" label={t("field.unit")} value={goalPanel.form.unit ?? ""} onChange={(e) => setGoalPanel((p) => p && { ...p, form: { ...p.form, unit: e.target.value } })} />
          </>
        ) : null}
      </EditPanel>

      <EditPanel
        open={riskPanel !== null}
        title={riskPanel?.id ? t("editRisk") : t("addRisk")}
        onClose={() => setRiskPanel(null)}
        onSave={saveRisk}
        saving={riskSaving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={riskError}
      >
        {riskPanel ? (
          <>
            <TextField id="rk-title" label={t("field.title")} value={riskPanel.form.title} onChange={(e) => setRiskPanel((p) => p && { ...p, form: { ...p.form, title: e.target.value } })} />
            <TextAreaField id="rk-desc" label={t("field.description")} rows={2} value={riskPanel.form.description ?? ""} onChange={(e) => setRiskPanel((p) => p && { ...p, form: { ...p.form, description: e.target.value } })} />
            <SelectField id="rk-cat" label={t("field.category")} value={riskPanel.form.category} onChange={(e) => setRiskPanel((p) => p && { ...p, form: { ...p.form, category: e.target.value as RiskCategory } })}>
              {RISK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tRiskCat(c)}
                </option>
              ))}
            </SelectField>
            <SelectField id="rk-probability" label={t("probability")} value={riskPanel.form.probability} onChange={(e) => setRiskPanel((p) => p && { ...p, form: { ...p.form, probability: e.target.value as RiskLevel } })}>
              {RISK_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {tRiskLevel(l)}
                </option>
              ))}
            </SelectField>
            <SelectField id="rk-impact" label={t("impact")} value={riskPanel.form.impact} onChange={(e) => setRiskPanel((p) => p && { ...p, form: { ...p.form, impact: e.target.value as RiskLevel } })}>
              {RISK_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {tRiskLevel(l)}
                </option>
              ))}
            </SelectField>
            <TextAreaField id="rk-mitigation" label={t("field.mitigation")} rows={2} value={riskPanel.form.mitigation ?? ""} onChange={(e) => setRiskPanel((p) => p && { ...p, form: { ...p.form, mitigation: e.target.value } })} />
            <SelectField id="rk-status" label={t("field.status")} value={riskPanel.form.status} onChange={(e) => setRiskPanel((p) => p && { ...p, form: { ...p.form, status: e.target.value as RiskStatus } })}>
              {RISK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {tRiskStatus(s)}
                </option>
              ))}
            </SelectField>
          </>
        ) : null}
      </EditPanel>
    </div>
  );
}
