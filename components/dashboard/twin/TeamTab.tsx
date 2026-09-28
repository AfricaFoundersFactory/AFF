"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EditPanel } from "./EditPanel";
import { SectionCard, ItemCard } from "./shared";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { CheckboxField } from "@/components/forms/CheckboxField";
import {
  addFounderAction,
  updateFounderAction,
  removeFounderAction,
  addTeamMemberAction,
  updateTeamMemberAction,
  removeTeamMemberAction,
} from "@/lib/actions/digital-twin";
import { toStringList } from "@/lib/validation";
import type { Founder, TeamMember, FounderStatus, EngagementType } from "@/types/digital-twin";

const FOUNDER_STATUSES: FounderStatus[] = ["active", "advisor", "departed"];
const ENGAGEMENTS: EngagementType[] = ["full_time", "part_time"];

const emptyFounder: Omit<Founder, "id"> = {
  firstName: "",
  lastName: "",
  role: "",
  status: "active",
  engagement: "full_time",
  isPrimaryContact: false,
};

const emptyMember: Omit<TeamMember, "id"> = {
  name: "",
  role: "",
  engagement: "full_time",
  expertise: [],
};

export function TeamTab({
  startupId,
  founders,
  team,
  onSaved,
}: {
  startupId: string;
  founders: Founder[];
  team: TeamMember[];
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.myStartup.team");
  const tc = useTranslations("common");
  const tm = useTranslations("dashboard.myStartup.common");
  const tStatus = useTranslations("dashboard.digitalTwin.enums.founderStatus");
  const tEngagement = useTranslations("dashboard.digitalTwin.enums.engagementType");

  // Founders
  const [founderPanel, setFounderPanel] = useState<{ id: string | null; form: Omit<Founder, "id"> } | null>(null);
  const [founderSaving, setFounderSaving] = useState(false);
  const [founderError, setFounderError] = useState<string | undefined>();

  const openAddFounder = () => setFounderPanel({ id: null, form: emptyFounder });
  const openEditFounder = (f: Founder) => setFounderPanel({ id: f.id, form: f });

  const saveFounder = async () => {
    if (!founderPanel) return;
    setFounderSaving(true);
    setFounderError(undefined);
    const result = founderPanel.id
      ? await updateFounderAction(startupId, founderPanel.id, founderPanel.form)
      : await addFounderAction(startupId, founderPanel.form);
    setFounderSaving(false);
    if (!result.ok) {
      setFounderError(result.error);
      return;
    }
    setFounderPanel(null);
    onSaved();
  };

  const removeFounder = async (id: string) => {
    await removeFounderAction(startupId, id);
    onSaved();
  };

  // Team members
  const [memberPanel, setMemberPanel] = useState<{ id: string | null; form: Omit<TeamMember, "id">; expertiseText: string } | null>(
    null,
  );
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError] = useState<string | undefined>();

  const openAddMember = () => setMemberPanel({ id: null, form: emptyMember, expertiseText: "" });
  const openEditMember = (m: TeamMember) => setMemberPanel({ id: m.id, form: m, expertiseText: m.expertise.join(", ") });

  const saveMember = async () => {
    if (!memberPanel) return;
    setMemberSaving(true);
    setMemberError(undefined);
    const payload = { ...memberPanel.form, expertise: toStringList(memberPanel.expertiseText) };
    const result = memberPanel.id
      ? await updateTeamMemberAction(startupId, memberPanel.id, payload)
      : await addTeamMemberAction(startupId, payload);
    setMemberSaving(false);
    if (!result.ok) {
      setMemberError(result.error);
      return;
    }
    setMemberPanel(null);
    onSaved();
  };

  const removeMember = async (id: string) => {
    await removeTeamMemberAction(startupId, id);
    onSaved();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("foundersTitle")} editLabel={t("addFounder")} onEdit={openAddFounder}>
        {founders.length > 0 ? (
          <div className="flex flex-col gap-3">
            {founders.map((f) => (
              <ItemCard
                key={f.id}
                title={`${f.firstName} ${f.lastName}${f.isPrimaryContact ? ` · ${t("primaryContact")}` : ""}`}
                subtitle={`${f.role} · ${tEngagement(f.engagement)} · ${tStatus(f.status)}`}
                onEdit={() => openEditFounder(f)}
                onRemove={() => removeFounder(f.id)}
                editLabel={tm("edit")}
                removeLabel={tm("remove")}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={t("noFounders")} body={t("noFoundersBody")} />
        )}
      </SectionCard>

      <SectionCard title={t("teamTitle")} editLabel={t("addMember")} onEdit={openAddMember}>
        {team.length > 0 ? (
          <div className="flex flex-col gap-3">
            {team.map((m) => (
              <ItemCard
                key={m.id}
                title={m.name}
                subtitle={[m.role, m.department, tEngagement(m.engagement)].filter(Boolean).join(" · ")}
                onEdit={() => openEditMember(m)}
                onRemove={() => removeMember(m.id)}
                editLabel={tm("edit")}
                removeLabel={tm("remove")}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={t("noTeam")} body={t("noTeamBody")} />
        )}
      </SectionCard>

      <EditPanel
        open={founderPanel !== null}
        title={founderPanel?.id ? t("editFounder") : t("addFounder")}
        onClose={() => setFounderPanel(null)}
        onSave={saveFounder}
        saving={founderSaving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={founderError}
      >
        {founderPanel ? (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <TextField id="fd-first" label={t("field.firstName")} value={founderPanel.form.firstName} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, firstName: e.target.value } })} />
              </div>
              <div className="flex-1">
                <TextField id="fd-last" label={t("field.lastName")} value={founderPanel.form.lastName} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, lastName: e.target.value } })} />
              </div>
            </div>
            <TextField id="fd-role" label={t("field.role")} value={founderPanel.form.role} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, role: e.target.value } })} />
            <TextField id="fd-email" label={t("field.email")} type="email" value={founderPanel.form.email ?? ""} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, email: e.target.value } })} />
            <TextField id="fd-phone" label={t("field.phone")} value={founderPanel.form.phone ?? ""} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, phone: e.target.value } })} />
            <TextField id="fd-linkedin" label={t("field.linkedin")} type="url" value={founderPanel.form.linkedin ?? ""} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, linkedin: e.target.value } })} />
            <TextField id="fd-country" label={t("field.country")} value={founderPanel.form.country ?? ""} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, country: e.target.value } })} />
            <TextAreaField id="fd-bio" label={t("field.bio")} rows={2} value={founderPanel.form.bio ?? ""} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, bio: e.target.value } })} />
            <SelectField id="fd-status" label={t("field.status")} value={founderPanel.form.status} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, status: e.target.value as FounderStatus } })}>
              {FOUNDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {tStatus(s)}
                </option>
              ))}
            </SelectField>
            <SelectField id="fd-engagement" label={t("field.engagement")} value={founderPanel.form.engagement} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, engagement: e.target.value as EngagementType } })}>
              {ENGAGEMENTS.map((v) => (
                <option key={v} value={v}>
                  {tEngagement(v)}
                </option>
              ))}
            </SelectField>
            <TextField id="fd-ownership" label={t("field.ownershipPct")} type="number" min={0} max={100} value={founderPanel.form.ownershipPct ?? ""} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, ownershipPct: e.target.value ? Number(e.target.value) : undefined } })} />
            <CheckboxField id="fd-primary" label={t("field.isPrimaryContact")} checked={founderPanel.form.isPrimaryContact} onChange={(e) => setFounderPanel((p) => p && { ...p, form: { ...p.form, isPrimaryContact: e.target.checked } })} />
          </>
        ) : null}
      </EditPanel>

      <EditPanel
        open={memberPanel !== null}
        title={memberPanel?.id ? t("editMember") : t("addMember")}
        onClose={() => setMemberPanel(null)}
        onSave={saveMember}
        saving={memberSaving}
        saveLabel={tc("submit")}
        cancelLabel={tc("cancel")}
        error={memberError}
      >
        {memberPanel ? (
          <>
            <TextField id="tm-name" label={t("field.name")} value={memberPanel.form.name} onChange={(e) => setMemberPanel((p) => p && { ...p, form: { ...p.form, name: e.target.value } })} />
            <TextField id="tm-role" label={t("field.role")} value={memberPanel.form.role} onChange={(e) => setMemberPanel((p) => p && { ...p, form: { ...p.form, role: e.target.value } })} />
            <TextField id="tm-department" label={t("field.department")} value={memberPanel.form.department ?? ""} onChange={(e) => setMemberPanel((p) => p && { ...p, form: { ...p.form, department: e.target.value } })} />
            <SelectField id="tm-engagement" label={t("field.engagement")} value={memberPanel.form.engagement} onChange={(e) => setMemberPanel((p) => p && { ...p, form: { ...p.form, engagement: e.target.value as EngagementType } })}>
              {ENGAGEMENTS.map((v) => (
                <option key={v} value={v}>
                  {tEngagement(v)}
                </option>
              ))}
            </SelectField>
            <TextField id="tm-start" label={t("field.startDate")} type="date" value={memberPanel.form.startDate ?? ""} onChange={(e) => setMemberPanel((p) => p && { ...p, form: { ...p.form, startDate: e.target.value } })} />
            <TextField id="tm-linkedin" label={t("field.linkedin")} type="url" value={memberPanel.form.linkedin ?? ""} onChange={(e) => setMemberPanel((p) => p && { ...p, form: { ...p.form, linkedin: e.target.value } })} />
            <TextAreaField id="tm-bio" label={t("field.bio")} rows={2} value={memberPanel.form.bio ?? ""} onChange={(e) => setMemberPanel((p) => p && { ...p, form: { ...p.form, bio: e.target.value } })} />
            <TextField id="tm-expertise" label={t("field.expertise")} placeholder={t("commaSeparated")} value={memberPanel.expertiseText} onChange={(e) => setMemberPanel((p) => p && { ...p, expertiseText: e.target.value })} />
          </>
        ) : null}
      </EditPanel>
    </div>
  );
}
