"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { EditPanel } from "@/components/dashboard/twin/EditPanel";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { createDocumentAction, addDocumentVersionAction, verifyDocumentAction, removeDocumentAction } from "@/lib/actions/data-room";
import type { DataRoom, DataRoomCategory, DataRoomChecklist, DataRoomCompletion, DocumentVisibility } from "@/types/data-room";

export type DataRoomPageEntry = {
  room: DataRoom;
  checklist: DataRoomChecklist;
  completion: DataRoomCompletion;
};

const CATEGORIES: DataRoomCategory[] = [
  "corporate",
  "legal",
  "finance",
  "fundraising",
  "product",
  "commercial",
  "team",
  "ip",
  "compliance",
  "impact_esg",
  "other",
];
const VISIBILITIES: DocumentVisibility[] = ["private", "aff_team", "experts", "investors", "public"];

function statusClasses(status: string): string {
  switch (status) {
    case "available":
    case "verified":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "outdated":
    case "needs_review":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default:
      return "border-aff-line bg-aff-bg text-aff-muted";
  }
}

export function DataRoomView({ dataByStartupId }: { dataByStartupId: Record<string, DataRoomPageEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.dataRoom");
  const router = useRouter();

  if (!entry) {
    return <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />;
  }

  const { room, checklist, completion } = entry;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      <DashboardSection title={t("completion.title")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center">
            <div className="font-heading text-[34px] font-semibold leading-none text-aff-text">
              {completion.availableCount}
              <span className="text-lg font-medium text-aff-muted">/{completion.requiredTotal}</span>
            </div>
            <div className="mt-1 text-[12px] text-aff-muted">{t("completion.label")}</div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard label={t("completion.available")} value={String(completion.availableCount)} />
            <MetricCard label={t("completion.outdated")} value={String(completion.outdatedCount)} />
            <MetricCard label={t("completion.missing")} value={String(completion.missingCount)} />
          </div>
        </div>
        <p className="mt-3 text-[12px] text-aff-muted">{t("completion.disclaimer")}</p>
      </DashboardSection>

      <DashboardSection title={t("noStorage.title")}>
        <p className="text-[13.5px] text-aff-muted">{t("noStorage.body")}</p>
      </DashboardSection>

      <ChecklistSection startupId={activeStartup.id} checklist={checklist} onSaved={() => router.refresh()} />

      <DocumentsSection startupId={activeStartup.id} documents={room.documents} onSaved={() => router.refresh()} />
    </div>
  );
}

function ChecklistSection({
  startupId,
  checklist,
  onSaved,
}: {
  startupId: string;
  checklist: DataRoomChecklist;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.dataRoom");
  const tReq = useTranslations("dashboard.dataRoom.requirements");
  const tCategory = useTranslations("dashboard.dataRoom.categories");
  const tStatus = useTranslations("dashboard.dataRoom.status");
  const [pending, startTransition] = useTransition();
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  const grouped = new Map<string, typeof checklist.items>();
  for (const item of checklist.items) {
    const list = grouped.get(item.requirement.category) ?? [];
    list.push(item);
    grouped.set(item.requirement.category, list);
  }

  function handleCreateFromRequirement(requirementKey: string, category: DataRoomCategory, titleKey: string) {
    setCreatingKey(requirementKey);
    startTransition(async () => {
      await createDocumentAction(startupId, {
        category,
        title: tReq(titleKey),
        visibility: "aff_team",
        requirementKey,
      });
      setCreatingKey(null);
      onSaved();
    });
  }

  return (
    <DashboardSection title={t("checklist.title")}>
      <p className="mb-4 text-[12.5px] text-aff-muted">{t("checklist.stageNote", { stage: checklist.stage })}</p>
      <div className="flex flex-col gap-5">
        {Array.from(grouped.entries()).map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-aff-muted">{tCategory(category)}</h3>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.requirement.key} className="flex items-center justify-between gap-3 rounded-lg border border-aff-line bg-aff-bg px-4 py-3">
                  <span className="text-[13.5px] text-aff-text">{tReq(item.requirement.titleKey)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(item.status)}`}>{tStatus(item.status)}</span>
                    {item.status === "missing" ? (
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-[12px]"
                        disabled={pending && creatingKey === item.requirement.key}
                        onClick={() => handleCreateFromRequirement(item.requirement.key, item.requirement.category, item.requirement.titleKey)}
                      >
                        {t("checklist.startDocument")}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}

function DocumentsSection({
  startupId,
  documents,
  onSaved,
}: {
  startupId: string;
  documents: DataRoom["documents"];
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.dataRoom");
  const tCategory = useTranslations("dashboard.dataRoom.categories");
  const tStatus = useTranslations("dashboard.dataRoom.status");
  const tVisibility = useTranslations("dashboard.dataRoom.visibility");
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const [form, setForm] = useState({ title: "", category: "other" as DataRoomCategory, description: "", visibility: "private" as DocumentVisibility });

  function handleCreate() {
    if (!form.title.trim()) return;
    startSaving(async () => {
      await createDocumentAction(startupId, { title: form.title, category: form.category, description: form.description || undefined, visibility: form.visibility });
      setOpen(false);
      setForm({ title: "", category: "other", description: "", visibility: "private" });
      onSaved();
    });
  }

  function handleAddVersion(documentId: string) {
    startSaving(async () => {
      await addDocumentVersionAction(startupId, documentId, { fileName: `document-${documentId.slice(0, 6)}.pdf`, mimeType: "application/pdf", size: 100_000 });
      onSaved();
    });
  }

  function handleVerify(documentId: string) {
    startSaving(async () => {
      await verifyDocumentAction(startupId, documentId);
      onSaved();
    });
  }

  function handleRemove(documentId: string) {
    startSaving(async () => {
      await removeDocumentAction(startupId, documentId);
      onSaved();
    });
  }

  return (
    <DashboardSection
      title={t("documents.title")}
      action={
        <Button variant="secondary" className="px-4 py-2 text-[12.5px]" onClick={() => setOpen(true)}>
          {t("documents.add")}
        </Button>
      }
    >
      {documents.length === 0 ? (
        <EmptyState title={t("documents.emptyTitle")} body={t("documents.emptyBody")} />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-aff-line bg-aff-bg px-4 py-3">
              <div>
                <div className="text-[13.5px] font-semibold text-aff-text">{doc.title}</div>
                <div className="mt-0.5 text-[12px] text-aff-muted">
                  {tCategory(doc.category)} · {tVisibility(doc.visibility)} · {t("documents.versionsCount", { count: doc.versions.length })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(doc.status)}`}>{tStatus(doc.status)}</span>
                {doc.versions.length === 0 ? (
                  <Button variant="secondary" className="px-3 py-1.5 text-[12px]" onClick={() => handleAddVersion(doc.id)} disabled={saving}>
                    {t("documents.recordVersion")}
                  </Button>
                ) : doc.status !== "verified" ? (
                  <Button variant="secondary" className="px-3 py-1.5 text-[12px]" onClick={() => handleVerify(doc.id)} disabled={saving}>
                    {t("documents.markVerified")}
                  </Button>
                ) : null}
                <button
                  type="button"
                  className="text-[12px] font-semibold text-aff-muted hover:text-red-400"
                  onClick={() => handleRemove(doc.id)}
                  disabled={saving}
                >
                  {t("documents.remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[12px] text-aff-muted">{t("documents.metadataOnlyDisclaimer")}</p>

      <EditPanel open={open} title={t("documents.add")} onClose={() => setOpen(false)} onSave={handleCreate} saving={saving} saveLabel={t("form.save")} cancelLabel={t("form.cancel")}>
        <TextField id="doc-title" label={t("documents.titleLabel")} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <SelectField id="doc-category" label={t("documents.categoryLabel")} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as DataRoomCategory }))}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tCategory(c)}
            </option>
          ))}
        </SelectField>
        <SelectField id="doc-visibility" label={t("documents.visibilityLabel")} value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as DocumentVisibility }))}>
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {tVisibility(v)}
            </option>
          ))}
        </SelectField>
        <TextField id="doc-description" label={t("documents.descriptionLabel")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </EditPanel>
    </DashboardSection>
  );
}
