"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Button } from "@/components/ui/Button";
import {
  addToShortlistAction,
  cancelIntroductionRequestAction,
  createDataRoomShareAction,
  createIntroductionDraftAction,
  createPipelineEntryAction,
  recordInteractionAction,
  revokeDataRoomShareAction,
  submitIntroductionRequestAction,
  updateIntroductionDraftAction,
  updateShortlistEntryAction,
} from "@/lib/actions/investors";
import type {
  DataRoomShare,
  FundraisingPipelineEntry,
  FundraisingRound,
  IntroductionReadinessChecklist,
  IntroductionRequest,
  InteractionType,
  InvestorInteraction,
  InvestorMatch,
  InvestorRecord,
  InvestorShortlistEntry,
} from "@/types/investors";

export type InvestorProfileStartupData = {
  match: InvestorMatch;
  shortlistEntry?: InvestorShortlistEntry;
  pipelineEntry?: FundraisingPipelineEntry;
  rounds: FundraisingRound[];
  interactions: InvestorInteraction[];
  introRequests: IntroductionRequest[];
  shares: DataRoomShare[];
  documents: { id: string; title: string; category: string }[];
  readiness: IntroductionReadinessChecklist;
};

const INTERACTION_TYPES: InteractionType[] = ["NOTE", "EMAIL", "CALL", "MEETING", "INTRODUCTION", "FOLLOW_UP", "DATA_ROOM_SHARED", "OTHER"];

export function InvestorProfileView({
  founderId,
  record,
  dataByStartupId,
}: {
  founderId: string;
  record: InvestorRecord;
  dataByStartupId: Record<string, InvestorProfileStartupData>;
}) {
  const t = useTranslations("dashboard.investors");
  const { activeStartup } = useStartup();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [interactionType, setInteractionType] = useState<InteractionType>("NOTE");
  const [interactionSummary, setInteractionSummary] = useState("");
  const [introReason, setIntroReason] = useState("");
  const [introContext, setIntroContext] = useState("");
  const [editingDraft, setEditingDraft] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const data = dataByStartupId[activeStartup.id];
  const { thesis } = record.profile;

  function formatMoney(amount: number, currency: string) {
    return `${amount.toLocaleString()} ${currency}`;
  }

  function addShortlist() {
    startTransition(async () => {
      await addToShortlistAction(activeStartup.id, record.organization.id);
    });
  }

  function saveNotes() {
    startTransition(async () => {
      await updateShortlistEntryAction(activeStartup.id, record.organization.id, { note: note || undefined, nextAction: nextAction || undefined });
    });
  }

  function addToPipeline() {
    startTransition(async () => {
      await createPipelineEntryAction(activeStartup.id, { investorId: record.organization.id, ownerFounderId: founderId });
    });
  }

  function submitInteraction() {
    if (!interactionSummary.trim()) return;
    startTransition(async () => {
      await recordInteractionAction(activeStartup.id, {
        investorId: record.organization.id,
        pipelineEntryId: data?.pipelineEntry?.id,
        type: interactionType,
        occurredAt: new Date().toISOString(),
        summary: interactionSummary,
        createdBy: founderId,
      });
      setInteractionSummary("");
    });
  }

  // §5 — DRAFT never means AFF received anything. Saving a draft is purely
  // local preparation; only submitIntroductionRequestAction (a separate,
  // deliberate action) transitions DRAFT -> REQUESTED.
  function saveIntroDraft() {
    startTransition(async () => {
      const latest = data?.introRequests[0];
      if (latest && latest.status === "DRAFT") {
        await updateIntroductionDraftAction(activeStartup.id, latest.id, {
          reason: introReason || undefined,
          context: introContext || undefined,
        });
      } else {
        await createIntroductionDraftAction(activeStartup.id, {
          investorId: record.organization.id,
          reason: introReason || undefined,
          context: introContext || undefined,
          createdBy: founderId,
        });
      }
      setEditingDraft(false);
    });
  }

  function submitIntroRequest(requestId: string) {
    startTransition(async () => {
      await submitIntroductionRequestAction(activeStartup.id, requestId);
    });
  }

  function discardIntroDraft(requestId: string) {
    startTransition(async () => {
      await cancelIntroductionRequestAction(activeStartup.id, requestId);
    });
  }

  function toggleDoc(id: string) {
    setSelectedDocIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function submitShare() {
    if (selectedDocIds.length === 0) return;
    startTransition(async () => {
      await createDataRoomShareAction(activeStartup.id, {
        investorId: record.organization.id,
        pipelineEntryId: data?.pipelineEntry?.id,
        documentIds: selectedDocIds,
      });
      setSelectedDocIds([]);
    });
  }

  function revoke(shareId: string) {
    startTransition(async () => {
      await revokeDataRoomShareAction(activeStartup.id, shareId);
    });
  }

  if (!data) return null;

  const latestIntro = data.introRequests[0];
  const canStartNewIntro = !latestIntro || latestIntro.status === "CANCELLED" || latestIntro.status === "DECLINED";
  const isDraftIntro = latestIntro?.status === "DRAFT";

  function startEditingDraft() {
    setIntroReason(latestIntro?.reason ?? "");
    setIntroContext(latestIntro?.context ?? "");
    setEditingDraft(true);
  }

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <Link href="/dashboard/investors" className="text-[13px] font-semibold text-aff-accent hover:underline">
        ← {t("profile.back")}
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{record.organization.name}</h1>
          <span className="rounded-full border border-dashed border-aff-line-strong px-2 py-0.5 text-[11px] text-aff-muted">{t("card.demoBadge")}</span>
        </div>
        <p className="mt-1 text-[13.5px] text-aff-muted">{t(`investorType.${record.organization.type}`)}</p>
        {record.organization.description ? <p className="mt-2 text-[14.5px] text-aff-text">{record.organization.description}</p> : null}
      </div>

      <DashboardSection title={t("profile.thesisTitle")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[12px] font-semibold text-aff-muted">{t("profile.stages")}</p>
            <p className="text-[13.5px] text-aff-text">{thesis.stages.length ? thesis.stages.join(", ") : t("profile.unknown")}</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-aff-muted">{t("profile.industries")}</p>
            <p className="text-[13.5px] text-aff-text">{thesis.industries.length ? thesis.industries.join(", ") : t("profile.unknown")}</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-aff-muted">{t("profile.geographies")}</p>
            <p className="text-[13.5px] text-aff-text">{thesis.geographies.length ? thesis.geographies.join(", ") : t("profile.unknown")}</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-aff-muted">{t("profile.countries")}</p>
            <p className="text-[13.5px] text-aff-text">{thesis.countries.length ? thesis.countries.join(", ") : t("profile.unknown")}</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-aff-muted">{t("profile.ticket")}</p>
            <p className="text-[13.5px] text-aff-text">
              {thesis.ticketMin || thesis.ticketMax
                ? `${thesis.ticketMin ? formatMoney(thesis.ticketMin.amount, thesis.ticketMin.currency) : "…"} – ${thesis.ticketMax ? formatMoney(thesis.ticketMax.amount, thesis.ticketMax.currency) : "…"}`
                : t("profile.unknown")}
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-aff-muted">{t("profile.instruments")}</p>
            <p className="text-[13.5px] text-aff-text">{thesis.instruments.length ? thesis.instruments.join(", ") : t("profile.unknown")}</p>
          </div>
          {thesis.impactThemes.length > 0 ? (
            <div>
              <p className="text-[12px] font-semibold text-aff-muted">{t("profile.impactThemes")}</p>
              <p className="text-[13.5px] text-aff-text">{thesis.impactThemes.join(", ")}</p>
            </div>
          ) : null}
        </div>
      </DashboardSection>

      <DashboardSection title={t("profile.matchTitle")}>
        {data.match.substantiveReasons.length === 0 && data.match.supplementaryReasons.length === 0 && data.match.mismatches.length === 0 ? (
          <p className="text-[13px] text-aff-muted">{t("profile.noReasons")}</p>
        ) : (
          <div className="flex flex-col gap-2 text-[13.5px]">
            {[...data.match.substantiveReasons, ...data.match.supplementaryReasons].map((r) => (
              <p key={r} className="text-aff-text">
                ✓ {t(`reasons.${r}`)}
              </p>
            ))}
            {data.match.mismatches.map((m) => (
              <p key={m} className="text-amber-500">
                ⚠ {t(`mismatches.${m}`)}
              </p>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title={t("profile.relationshipStatus")}>
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] text-aff-text">
            {data.pipelineEntry ? t(`pipelineStage.${data.pipelineEntry.stage}`) : t("profile.notInPipeline")}
          </p>
          <div className="flex flex-wrap gap-2">
            {!data.shortlistEntry ? (
              <Button variant="secondary" disabled={pending} onClick={addShortlist} className="px-4 py-2 text-[12.5px]">
                {t("profile.addToShortlist")}
              </Button>
            ) : null}
            {!data.pipelineEntry ? (
              <Button variant="secondary" disabled={pending} onClick={addToPipeline} className="px-4 py-2 text-[12.5px]">
                {t("profile.addToPipeline")}
              </Button>
            ) : null}
          </div>
          <div>
            <label className="text-[12px] font-semibold text-aff-muted">{t("profile.founderNotes")}</label>
            <textarea
              defaultValue={data.shortlistEntry?.note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("profile.notesPlaceholder")}
              rows={2}
              className="mt-1 w-full rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              defaultValue={data.shortlistEntry?.nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder={t("profile.nextActionPlaceholder")}
              className="rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
            />
          </div>
          <div>
            <Button variant="primary" disabled={pending || !data.shortlistEntry} onClick={saveNotes} className="px-4 py-2 text-[12.5px]">
              {t("profile.save")}
            </Button>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title={t("introReadiness.title")}>
        <p className="mb-3 text-[12.5px] text-aff-muted">{t("introReadiness.note")}</p>
        <ul className="flex flex-col gap-1.5 text-[13.5px]">
          {data.readiness.items.map((item) => (
            <li key={item.key} className={item.met ? "text-aff-text" : "text-aff-muted"}>
              {item.met ? "✓" : "○"} {t(`introReadiness.${item.key}`)}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2">
          {canStartNewIntro ? (
            <>
              <p className="text-[12.5px] text-aff-muted">{t("introForm.draftNotice")}</p>
              <textarea
                value={introReason}
                onChange={(e) => setIntroReason(e.target.value)}
                placeholder={t("introForm.reasonPlaceholder")}
                rows={2}
                className="w-full rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
              />
              <textarea
                value={introContext}
                onChange={(e) => setIntroContext(e.target.value)}
                placeholder={t("introForm.contextPlaceholder")}
                rows={2}
                className="w-full rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
              />
              <div>
                <Button variant="secondary" disabled={pending} onClick={saveIntroDraft} className="px-4 py-2 text-[12.5px]">
                  {t("introForm.saveDraft")}
                </Button>
              </div>
            </>
          ) : isDraftIntro ? (
            <>
              <span className="w-fit rounded-full border border-dashed border-amber-500 px-2.5 py-1 text-[11px] font-semibold text-amber-500">
                {t("introForm.draftBadge")}
              </span>
              <p className="text-[12.5px] text-aff-muted">{t("introForm.draftNotice")}</p>
              {editingDraft ? (
                <>
                  <textarea
                    value={introReason}
                    onChange={(e) => setIntroReason(e.target.value)}
                    placeholder={t("introForm.reasonPlaceholder")}
                    rows={2}
                    className="w-full rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
                  />
                  <textarea
                    value={introContext}
                    onChange={(e) => setIntroContext(e.target.value)}
                    placeholder={t("introForm.contextPlaceholder")}
                    rows={2}
                    className="w-full rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" disabled={pending} onClick={saveIntroDraft} className="px-4 py-2 text-[12.5px]">
                      {t("introForm.saveDraft")}
                    </Button>
                    <Button variant="secondary" disabled={pending} onClick={() => setEditingDraft(false)} className="px-4 py-2 text-[12.5px]">
                      {t("introForm.cancelEdit")}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {latestIntro!.reason ? <p className="text-[13.5px] text-aff-text">{latestIntro!.reason}</p> : null}
                  {latestIntro!.context ? <p className="text-[13.5px] text-aff-text">{latestIntro!.context}</p> : null}
                  <p className="text-[12.5px] text-aff-muted">{t("introForm.noSlaNotice")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" disabled={pending} onClick={() => submitIntroRequest(latestIntro!.id)} className="px-4 py-2 text-[12.5px]">
                      {t("introForm.submit")}
                    </Button>
                    <Button variant="secondary" disabled={pending} onClick={startEditingDraft} className="px-4 py-2 text-[12.5px]">
                      {t("introForm.editDraft")}
                    </Button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => discardIntroDraft(latestIntro!.id)}
                      className="text-[12.5px] font-semibold text-red-500 hover:underline"
                    >
                      {t("introForm.discardDraft")}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-[13.5px] text-aff-text">{t(`introductionStatus.${latestIntro!.status}`)}</p>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title={t("profile.interactionsTitle")}>
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <select
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value as InteractionType)}
              className="rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13px] text-aff-text"
            >
              {INTERACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`interactionType.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={interactionSummary}
            onChange={(e) => setInteractionSummary(e.target.value)}
            placeholder={t("profile.recordInteraction")}
            rows={2}
            className="w-full rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
          />
          <div>
            <Button variant="secondary" disabled={pending || !interactionSummary.trim()} onClick={submitInteraction} className="px-4 py-2 text-[12.5px]">
              {t("profile.recordInteraction")}
            </Button>
          </div>
        </div>
        {data.interactions.length === 0 ? (
          <p className="text-[13px] text-aff-muted">{t("profile.noInteractions")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.interactions.map((i) => (
              <li key={i.id} className="rounded-lg border border-aff-line bg-aff-bg p-3 text-[13px]">
                <p className="font-semibold text-aff-text">
                  {t(`interactionType.${i.type}`)} · {new Date(i.occurredAt).toLocaleDateString()}
                </p>
                <p className="mt-0.5 text-aff-muted">{i.summary}</p>
                <p className="mt-1 text-[11px] italic text-aff-muted">{t("profile.recordedByFounder")}</p>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title={t("profile.shareDataRoomTitle")}>
        <p className="mb-3 text-[12.5px] text-aff-muted">{t("profile.shareDataRoomBody")}</p>
        <div className="mb-4 flex flex-col gap-2">
          {data.documents.map((doc) => (
            <label key={doc.id} className="flex items-center gap-2 text-[13px] text-aff-text">
              <input type="checkbox" checked={selectedDocIds.includes(doc.id)} onChange={() => toggleDoc(doc.id)} />
              {doc.title}
            </label>
          ))}
          <div>
            <Button variant="secondary" disabled={pending || selectedDocIds.length === 0} onClick={submitShare} className="px-4 py-2 text-[12.5px]">
              {t("profile.shareDocuments")}
            </Button>
          </div>
        </div>
        {data.shares.length === 0 ? (
          <p className="text-[13px] text-aff-muted">{t("profile.noShares")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.shares.map((share) => (
              <li key={share.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-aff-line bg-aff-bg p-3 text-[13px]">
                <span className="text-aff-text">
                  {share.documentIds.length} · {new Date(share.createdAt).toLocaleDateString()} ·{" "}
                  {share.status === "ACTIVE" ? t("profile.active") : t("profile.revoked")}
                </span>
                {share.status === "ACTIVE" ? (
                  <button type="button" disabled={pending} onClick={() => revoke(share.id)} className="text-[12.5px] font-semibold text-red-500 hover:underline">
                    {t("profile.revoke")}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
