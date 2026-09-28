"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  updateSectionAction,
  refreshSectionFromProfileAction,
  createVersionAction,
  duplicateVersionAction,
  renameVersionAction,
  finalizeVersionAction,
  archiveVersionAction,
  setActiveVersionAction,
} from "@/lib/actions/pitch";
import type { PitchSection, PitchSectionStatus, PitchVersion, PitchWorkspace } from "@/types/pitch";
import { cn } from "@/lib/utils";

export type PitchEditorEntry = {
  workspace: PitchWorkspace | undefined;
  activeVersion: PitchVersion | undefined;
  sourceUpdates: Record<string, string[]>;
};

const STATUS_TONE: Record<PitchSectionStatus, string> = {
  empty: "text-aff-muted",
  draft: "text-aff-cyan",
  complete: "text-aff-accent",
  needs_work: "text-amber-400",
};

export function PitchEditorView({ dataByStartupId }: { dataByStartupId: Record<string, PitchEditorEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.pitch.editor");
  const tRoot = useTranslations("dashboard.pitch");
  const tSections = useTranslations("dashboard.pitch.sections");
  const tStatus = useTranslations("dashboard.pitch.status");
  const tVersions = useTranslations("dashboard.pitch.versions");
  const tSource = useTranslations("dashboard.pitch.sourceTraceability");
  const tKey = useTranslations();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const version = entry?.activeVersion;
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(version?.sections[0]?.id);
  const [draft, setDraft] = useState<{ content: string; keyPoints: string[] } | null>(null);

  const orderedSections = useMemo(() => (version ? [...version.sections].sort((a, b) => a.order - b.order) : []), [version]);
  const selected = orderedSections.find((s) => s.id === selectedSectionId) ?? orderedSections[0];

  if (!entry || !entry.workspace || !version) {
    return (
      <div className="mx-auto flex max-w-[700px] flex-col gap-4">
        <EmptyState title={tRoot("overview.noPitchTitle")} body={tRoot("overview.noPitchBody")} />
        <ButtonLink href="/dashboard/pitch" className="w-fit px-4 py-2.5 text-[13.5px]">
          {tRoot("overview.startPitchLab")}
        </ButtonLink>
      </div>
    );
  }

  const editable = version.status === "draft" || version.status === "in_review";
  const content = draft && selected && draft ? draft.content : selected?.content ?? "";
  const keyPoints = draft ? draft.keyPoints : selected?.keyPoints ?? [];

  const selectSection = (s: PitchSection) => {
    setSelectedSectionId(s.id);
    setDraft(null);
  };

  const handleSave = () => {
    if (!selected) return;
    const patch = draft ?? { content: selected.content, keyPoints: selected.keyPoints };
    startTransition(async () => {
      await updateSectionAction(activeStartup.id, version.id, selected.id, patch);
      setDraft(null);
      router.refresh();
    });
  };

  const handleStatus = (status: PitchSectionStatus) => {
    if (!selected) return;
    startTransition(async () => {
      await updateSectionAction(activeStartup.id, version.id, selected.id, { status });
      router.refresh();
    });
  };

  const handleImport = () => {
    if (!selected) return;
    startTransition(async () => {
      await refreshSectionFromProfileAction(activeStartup.id, version.id, selected.id);
      router.refresh();
    });
  };

  const handleNewVersion = () => {
    startTransition(async () => {
      await createVersionAction(activeStartup.id);
      router.refresh();
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      await duplicateVersionAction(activeStartup.id, version.id);
      router.refresh();
    });
  };

  const handleFinalize = () => {
    startTransition(async () => {
      await finalizeVersionAction(activeStartup.id, version.id);
      router.refresh();
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      await archiveVersionAction(activeStartup.id, version.id);
      router.refresh();
    });
  };

  const handleSwitchVersion = (versionId: string) => {
    startTransition(async () => {
      await setActiveVersionAction(activeStartup.id, versionId);
      router.refresh();
    });
  };

  const handleRename = () => {
    if (typeof window === "undefined") return;
    const title = window.prompt(tVersions("rename"), version.title);
    if (!title) return;
    startTransition(async () => {
      await renameVersionAction(activeStartup.id, version.id, title);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex max-w-[1300px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
          <p className="mt-1.5 text-[13px] text-aff-muted">
            {version.title} · {tVersions(`statusLabels.${version.status}`)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleNewVersion} className="px-3 py-2 text-[12.5px]">
            {tVersions("newVersion")}
          </Button>
          <Button variant="secondary" onClick={handleDuplicate} className="px-3 py-2 text-[12.5px]">
            {tVersions("duplicate")}
          </Button>
          <Button variant="secondary" onClick={handleRename} className="px-3 py-2 text-[12.5px]" disabled={!editable}>
            {tVersions("rename")}
          </Button>
          <Button variant="secondary" onClick={handleFinalize} className="px-3 py-2 text-[12.5px]" disabled={!editable}>
            {tVersions("finalize")}
          </Button>
          <Button variant="secondary" onClick={handleArchive} className="px-3 py-2 text-[12.5px]">
            {tVersions("archive")}
          </Button>
        </div>
      </div>

      {entry.workspace.versions.length > 1 ? (
        <DashboardSection title={tVersions("title")}>
          <div className="flex flex-wrap gap-2">
            {[...entry.workspace.versions]
              .sort((a, b) => a.version - b.version)
              .map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSwitchVersion(v.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] font-semibold",
                    v.id === version.id ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted",
                  )}
                >
                  {v.title} · {tVersions(`statusLabels.${v.status}`)}
                </button>
              ))}
          </div>
        </DashboardSection>
      ) : null}

      {!editable ? <p className="text-[12.5px] text-amber-400">{t("readOnlyFinal")}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_300px]">
        {/* LEFT: section list */}
        <DashboardSection title={t("sectionsNav")} className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {orderedSections.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSection(s)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-left text-[12.5px] font-medium",
                  selected?.id === s.id ? "bg-aff-accent-soft text-aff-text" : "text-aff-muted hover:bg-aff-bg",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{tSections(`${s.type}.title`)}</span>
                  {entry.sourceUpdates[s.id] ? <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> : null}
                </div>
                <div className={cn("text-[11px]", STATUS_TONE[s.status])}>{tStatus(s.status)}</div>
              </button>
            ))}
          </div>
        </DashboardSection>

        {/* CENTER: section editor */}
        {selected ? (
          <DashboardSection title={tSections(`${selected.type}.title`)}>
            <p className="mb-2 text-[11.5px] font-semibold text-aff-muted">
              {selected.required ? t("required") : t("optional")}
            </p>
            <textarea
              value={content}
              disabled={!editable}
              onChange={(e) => setDraft({ content: e.target.value, keyPoints })}
              rows={8}
              className="w-full rounded-lg border border-aff-line bg-transparent px-3 py-2.5 text-[13.5px] text-aff-text disabled:opacity-60"
            />

            <p className="mb-2 mt-4 text-[12px] font-semibold tracking-[0.06em] text-aff-muted">{t("keyPointsTitle")}</p>
            <div className="flex flex-col gap-2">
              {keyPoints.map((kp, idx) => (
                <input
                  key={idx}
                  value={kp}
                  disabled={!editable}
                  onChange={(e) => {
                    const next = [...keyPoints];
                    next[idx] = e.target.value;
                    setDraft({ content, keyPoints: next });
                  }}
                  className="rounded-md border border-aff-line bg-transparent px-2.5 py-1.5 text-[12.5px] text-aff-text disabled:opacity-60"
                />
              ))}
              {editable ? (
                <button
                  onClick={() => setDraft({ content, keyPoints: [...keyPoints, ""] })}
                  className="w-fit text-[12px] font-semibold text-aff-accent"
                >
                  {t("addKeyPoint")}
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={!editable} className="px-4 py-2 text-[12.5px]">
                {t("save")}
              </Button>
              <Button variant="secondary" onClick={() => handleStatus("complete")} disabled={!editable} className="px-3 py-2 text-[12px]">
                {t("markComplete")}
              </Button>
              <Button variant="secondary" onClick={() => handleStatus("needs_work")} disabled={!editable} className="px-3 py-2 text-[12px]">
                {t("markNeedsWork")}
              </Button>
            </div>
          </DashboardSection>
        ) : (
          <EmptyState title={t("sectionsNav")} />
        )}

        {/* RIGHT: guidance + source */}
        {selected ? (
          <div className="flex flex-col gap-4">
            <DashboardSection title={t("guidanceTitle")}>
              <p className="text-[12.5px] leading-relaxed text-aff-muted">{tSections(`${selected.type}.guidance`)}</p>
            </DashboardSection>
            <DashboardSection title={t("sourceTitle")}>
              {selected.sourceReferences.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {selected.sourceReferences.map((ref) => (
                    <li key={ref.fieldKey} className="text-[12px] text-aff-muted">
                      {tSource("badge")}: {tKey(ref.labelKey)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-aff-muted">—</p>
              )}
              {entry.sourceUpdates[selected.id] ? (
                <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
                  <p className="text-[12px] font-semibold text-amber-400">{tSource("updatedBanner")}</p>
                  <button onClick={handleImport} className="mt-1.5 text-[12px] font-semibold text-aff-accent">
                    {tSource("reviewUpdate")}
                  </button>
                </div>
              ) : null}
              {editable ? (
                <Button variant="secondary" onClick={handleImport} className="mt-3 w-full justify-center px-3 py-2 text-[12px]">
                  {tSource("importCta")}
                </Button>
              ) : null}
            </DashboardSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}
