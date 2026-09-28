"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { EditPanel } from "@/components/dashboard/twin/EditPanel";
import {
  addToShortlistAction,
  removeFromShortlistAction,
  createPipelineEntryAction,
  createRoundAction,
  moveStageAction,
  searchInvestorsAction,
  updateRoundAction,
  updateRoundStatusAction,
} from "@/lib/actions/investors";
import type {
  FundraisingRound,
  FundraisingRoundStatus,
  IntroductionReadinessChecklist,
  InvestorFilters,
  InvestorMatch,
  InvestorRecord,
  InvestorShortlistEntry,
  PipelineStage,
} from "@/types/investors";
import type { FundraisingPipelineEntry, IntroductionRequest } from "@/types/investors";
import type { StartupStage } from "@/types/common";
import type { FundingInstrument } from "@/types/digital-twin";

export type InvestorsStartupData = {
  matches: InvestorMatch[];
  shortlist: InvestorShortlistEntry[];
  pipeline: FundraisingPipelineEntry[];
  rounds: FundraisingRound[];
  introRequests: IntroductionRequest[];
  readiness: IntroductionReadinessChecklist;
  hasFundingRequirement: boolean;
};

type Tab = "recommended" | "discover" | "shortlist" | "pipeline";

const PIPELINE_STAGES: PipelineStage[] = [
  "RESEARCH",
  "SHORTLISTED",
  "INTRO_REQUESTED",
  "CONTACTED",
  "MEETING",
  "FOLLOW_UP",
  "DUE_DILIGENCE",
  "TERM_SHEET",
  "COMMITTED",
  "PASSED",
  "DECLINED",
  "ARCHIVED",
];

const STAGES: StartupStage[] = ["idea", "mvp", "early_traction", "growth", "scale"];
const INSTRUMENTS: FundingInstrument[] = ["equity", "safe", "convertible_note", "debt", "grant", "revenue_based_financing", "other"];
const ROUND_STATUSES: FundraisingRoundStatus[] = ["PLANNING", "ACTIVE", "PAUSED", "CLOSED", "CANCELLED"];

function MatchReasons({ match }: { match: InvestorMatch }) {
  const t = useTranslations("dashboard.investors");
  if (match.substantiveReasons.length === 0 && match.supplementaryReasons.length === 0 && match.mismatches.length === 0) {
    return null;
  }
  return (
    <div className="mt-2 flex flex-col gap-1 text-[12.5px]">
      {[...match.substantiveReasons, ...match.supplementaryReasons].length > 0 ? (
        <p className="text-aff-muted">
          <span className="font-semibold text-aff-text">{t("card.whyRelevant")}:</span>{" "}
          {[...match.substantiveReasons, ...match.supplementaryReasons].map((r) => `✓ ${t(`reasons.${r}`)}`).join("  ")}
        </p>
      ) : null}
      {match.mismatches.length > 0 ? (
        <p className="text-amber-500">
          <span className="font-semibold">{t("card.potentialMismatch")}:</span>{" "}
          {match.mismatches.map((m) => `⚠ ${t(`mismatches.${m}`)}`).join("  ")}
        </p>
      ) : null}
    </div>
  );
}

function InvestorCard({
  record,
  match,
  shortlisted,
  startupId,
}: {
  record: InvestorRecord;
  match?: InvestorMatch;
  shortlisted: boolean;
  startupId: string;
}) {
  const t = useTranslations("dashboard.investors");
  const [pending, startTransition] = useTransition();

  function toggleShortlist() {
    startTransition(async () => {
      if (shortlisted) await removeFromShortlistAction(startupId, record.organization.id);
      else await addToShortlistAction(startupId, record.organization.id);
    });
  }

  return (
    <div className="rounded-xl border border-aff-line bg-aff-bg p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-[15px] font-semibold text-aff-text">{record.organization.name}</h3>
            <span className="rounded-full border border-dashed border-aff-line-strong px-2 py-0.5 text-[10.5px] text-aff-muted">
              {t("card.demoBadge")}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-aff-muted">{t(`investorType.${record.organization.type}`)}</p>
          {record.organization.description ? <p className="mt-1.5 text-[13px] text-aff-text">{record.organization.description}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/dashboard/investors/${record.organization.id}`} className="text-[13px] font-semibold text-aff-accent hover:underline">
            {t("card.viewProfile")}
          </Link>
        </div>
      </div>
      {match ? <MatchReasons match={match} /> : null}
      <div className="mt-3">
        <Button variant={shortlisted ? "secondary" : "primary"} disabled={pending} onClick={toggleShortlist} className="px-4 py-2 text-[12.5px]">
          {shortlisted ? t("card.shortlistRemove") : t("card.shortlistAdd")}
        </Button>
      </div>
    </div>
  );
}

type FilterState = {
  query: string;
  type: string;
  stage: string;
  industry: string;
  geography: string;
  country: string;
  instrument: string;
  impactTheme: string;
  ticketAmount: string;
  ticketCurrency: string;
};

const EMPTY_FILTERS: FilterState = {
  query: "",
  type: "",
  stage: "",
  industry: "",
  geography: "",
  country: "",
  instrument: "",
  impactTheme: "",
  ticketAmount: "",
  ticketCurrency: "",
};

function toServiceFilters(f: FilterState): InvestorFilters {
  const filters: InvestorFilters = {};
  if (f.query.trim()) filters.query = f.query.trim();
  if (f.type) filters.type = f.type as InvestorFilters["type"];
  if (f.stage) filters.stage = f.stage as StartupStage;
  if (f.industry) filters.industry = f.industry;
  if (f.geography) filters.geography = f.geography;
  if (f.country) filters.country = f.country;
  if (f.instrument) filters.instrument = f.instrument as FundingInstrument;
  if (f.impactTheme) filters.impactTheme = f.impactTheme;
  if (f.ticketAmount.trim() && !Number.isNaN(Number(f.ticketAmount))) {
    filters.ticketAmount = { amount: Number(f.ticketAmount), currency: f.ticketCurrency.trim() || "USD" };
  }
  return filters;
}

function hasAnyFilter(f: FilterState): boolean {
  return Object.entries(f).some(([, v]) => v.trim() !== "");
}

// ---------------------------------------------------------------------------
// Discover — filters wired straight to searchInvestors() via a Server
// Action, so the filter engine lives in exactly one place (lib/services/
// investors.ts). React only holds filter *inputs*, never re-implements the
// matching logic.
// ---------------------------------------------------------------------------
function DiscoverPanel({
  startupId,
  investors,
  matchByInvestorId,
  shortlistedIds,
}: {
  startupId: string;
  investors: InvestorRecord[];
  matchByInvestorId: Map<string, InvestorMatch>;
  shortlistedIds: Set<string>;
}) {
  const t = useTranslations("dashboard.investors");
  const tStage = useTranslations("dashboard.stage");
  const tInstrument = useTranslations("dashboard.digitalTwin.enums.fundingInstrument");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [results, setResults] = useState<InvestorRecord[]>(investors);
  const [pending, startTransition] = useTransition();

  const options = useMemo(() => {
    const industries = new Set<string>();
    const geographies = new Set<string>();
    const countries = new Set<string>();
    const impactThemes = new Set<string>();
    const types = new Set<string>();
    for (const r of investors) {
      r.profile.thesis.industries.forEach((v) => industries.add(v));
      r.profile.thesis.geographies.forEach((v) => geographies.add(v));
      r.profile.thesis.countries.forEach((v) => countries.add(v));
      r.profile.thesis.impactThemes.forEach((v) => impactThemes.add(v));
      types.add(r.organization.type);
    }
    return {
      industries: Array.from(industries).sort(),
      geographies: Array.from(geographies).sort(),
      countries: Array.from(countries).sort(),
      impactThemes: Array.from(impactThemes).sort(),
      types: Array.from(types).sort(),
    };
  }, [investors]);

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const result = await searchInvestorsAction(toServiceFilters(filters));
        if (result.ok) setResults(result.data);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [filters]);

  function set<K extends keyof FilterState>(key: K, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  return (
    <DashboardSection title={t("tabs.discover")}>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField id="inv-filter-query" label={t("filters.query")} value={filters.query} onChange={(e) => set("query", e.target.value)} placeholder={t("filters.queryPlaceholder")} />
        <SelectField id="inv-filter-type" label={t("filters.type")} value={filters.type} onChange={(e) => set("type", e.target.value)}>
          <option value="">{t("filters.all")}</option>
          {options.types.map((type) => (
            <option key={type} value={type}>
              {t(`investorType.${type}`)}
            </option>
          ))}
        </SelectField>
        <SelectField id="inv-filter-stage" label={t("filters.stage")} value={filters.stage} onChange={(e) => set("stage", e.target.value)}>
          <option value="">{t("filters.all")}</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {tStage(stage)}
            </option>
          ))}
        </SelectField>
        <SelectField id="inv-filter-industry" label={t("filters.industry")} value={filters.industry} onChange={(e) => set("industry", e.target.value)}>
          <option value="">{t("filters.all")}</option>
          {options.industries.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </SelectField>
        <SelectField id="inv-filter-geography" label={t("filters.geography")} value={filters.geography} onChange={(e) => set("geography", e.target.value)}>
          <option value="">{t("filters.all")}</option>
          {options.geographies.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </SelectField>
        <SelectField id="inv-filter-country" label={t("filters.country")} value={filters.country} onChange={(e) => set("country", e.target.value)}>
          <option value="">{t("filters.all")}</option>
          {options.countries.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </SelectField>
        <SelectField id="inv-filter-instrument" label={t("filters.instrument")} value={filters.instrument} onChange={(e) => set("instrument", e.target.value)}>
          <option value="">{t("filters.all")}</option>
          {INSTRUMENTS.map((v) => (
            <option key={v} value={v}>
              {tInstrument(v)}
            </option>
          ))}
        </SelectField>
        <SelectField id="inv-filter-impact" label={t("filters.impactTheme")} value={filters.impactTheme} onChange={(e) => set("impactTheme", e.target.value)}>
          <option value="">{t("filters.all")}</option>
          {options.impactThemes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </SelectField>
        <div className="flex gap-2">
          <div className="flex-[2]">
            <TextField
              id="inv-filter-ticket"
              label={t("filters.ticketAmount")}
              type="number"
              value={filters.ticketAmount}
              onChange={(e) => set("ticketAmount", e.target.value)}
              placeholder={t("filters.ticketAmountPlaceholder")}
            />
          </div>
          <div className="flex-1">
            <TextField id="inv-filter-ticket-currency" label={t("filters.currency")} value={filters.ticketCurrency} onChange={(e) => set("ticketCurrency", e.target.value)} placeholder="USD" />
          </div>
        </div>
      </div>
      {hasAnyFilter(filters) ? (
        <div className="mb-4">
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-[12.5px] font-semibold text-aff-muted hover:text-aff-text">
            {t("filters.clear")}
          </button>
        </div>
      ) : null}
      {pending ? <p className="mb-3 text-[12px] text-aff-muted">…</p> : null}
      {results.length === 0 ? (
        <EmptyState title={t("empty.discover")} />
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((record) => (
            <InvestorCard
              key={record.organization.id}
              record={record}
              match={matchByInvestorId.get(record.organization.id)}
              shortlisted={shortlistedIds.has(record.organization.id)}
              startupId={startupId}
            />
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

// ---------------------------------------------------------------------------
// Fundraising rounds — round-as-a-process tracking, distinct from the
// Funding Requirement (Financials). See roundForm.explainer copy below.
// ---------------------------------------------------------------------------
type RoundFormState = {
  name: string;
  amount: string;
  currency: string;
  instrument: string;
  status: FundraisingRoundStatus;
  targetCloseDate: string;
  notes: string;
};

function roundToForm(r?: FundraisingRound): RoundFormState {
  return {
    name: r?.name ?? "",
    amount: r ? String(r.targetAmount.amount) : "",
    currency: r?.targetAmount.currency ?? "USD",
    instrument: r?.instrument ?? "",
    status: r?.status ?? "PLANNING",
    targetCloseDate: r?.targetCloseDate ?? "",
    notes: r?.notes ?? "",
  };
}

function RoundsSection({ startupId, rounds }: { startupId: string; rounds: FundraisingRound[] }) {
  const t = useTranslations("dashboard.investors");
  const tInstrument = useTranslations("dashboard.digitalTwin.enums.fundingInstrument");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FundraisingRound | undefined>(undefined);
  const [form, setForm] = useState<RoundFormState>(roundToForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function openCreate() {
    setEditing(undefined);
    setForm(roundToForm());
    setError(undefined);
    setOpen(true);
  }

  function openEdit(round: FundraisingRound) {
    setEditing(round);
    setForm(roundToForm(round));
    setError(undefined);
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(undefined);
    const amount = Number(form.amount);
    if (!form.name.trim() || Number.isNaN(amount)) {
      setError(t("roundForm.validationError"));
      setSaving(false);
      return;
    }
    const payload = {
      name: form.name.trim(),
      targetAmount: { amount, currency: form.currency.trim() || "USD" },
      instrument: (form.instrument || undefined) as FundraisingRound["instrument"],
      targetCloseDate: form.targetCloseDate || undefined,
      notes: form.notes.trim() || undefined,
    };
    const result = editing ? await updateRoundAction(startupId, editing.id, payload) : await createRoundAction(startupId, payload);
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    if (editing && form.status !== editing.status) {
      const statusResult = await updateRoundStatusAction(startupId, editing.id, form.status);
      if (!statusResult.ok) {
        setError(statusResult.error);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setOpen(false);
  }

  return (
    <DashboardSection
      title={t("roundForm.sectionTitle")}
      action={
        <Button variant="secondary" onClick={openCreate} className="px-3 py-1.5 text-[12.5px]">
          {t("roundForm.newRound")}
        </Button>
      }
    >
      <p className="mb-3 text-[12px] text-aff-muted">{t("roundForm.explainer")}</p>
      {rounds.length === 0 ? (
        <EmptyState title={t("roundForm.empty")} />
      ) : (
        <div className="flex flex-col gap-2">
          {rounds.map((round) => (
            <div key={round.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-aff-line bg-aff-bg p-3">
              <div>
                <p className="text-[13.5px] font-semibold text-aff-text">{round.name}</p>
                <p className="text-[12px] text-aff-muted">
                  {round.targetAmount.amount.toLocaleString()} {round.targetAmount.currency} · {t(`roundStatus.${round.status}`)}
                  {round.targetCloseDate ? ` · ${round.targetCloseDate}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => openEdit(round)} className="text-[12.5px] font-semibold text-aff-accent hover:underline">
                {t("roundForm.edit")}
              </button>
            </div>
          ))}
        </div>
      )}

      <EditPanel
        open={open}
        title={editing ? t("roundForm.edit") : t("roundForm.newRound")}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        saving={saving}
        saveLabel={t("roundForm.save")}
        cancelLabel={t("roundForm.cancel")}
        error={error}
      >
        <TextField id="round-name" label={t("roundForm.name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="flex gap-3">
          <div className="flex-[2]">
            <TextField id="round-amount" type="number" label={t("roundForm.targetAmount")} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="flex-1">
            <TextField id="round-currency" label={t("roundForm.currency")} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
          </div>
        </div>
        <SelectField id="round-instrument" label={t("roundForm.instrument")} value={form.instrument} onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value }))}>
          <option value="">{t("filters.all")}</option>
          {INSTRUMENTS.map((i) => (
            <option key={i} value={i}>
              {tInstrument(i)}
            </option>
          ))}
        </SelectField>
        <SelectField id="round-status" label={t("roundForm.status")} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FundraisingRoundStatus }))}>
          {ROUND_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`roundStatus.${s}`)}
            </option>
          ))}
        </SelectField>
        <TextField id="round-close-date" type="date" label={t("roundForm.targetCloseDate")} value={form.targetCloseDate} onChange={(e) => setForm((f) => ({ ...f, targetCloseDate: e.target.value }))} />
        <TextAreaField id="round-notes" label={t("roundForm.notes")} rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </EditPanel>
    </DashboardSection>
  );
}

// ---------------------------------------------------------------------------
// Pipeline board — desktop: stage-grouped columns with explicit per-entry
// stage-change controls (no drag-and-drop). Mobile: a stage filter + a
// grouped vertical list, never a wide horizontal board.
// ---------------------------------------------------------------------------
function PipelineEntryRow({
  entry,
  investorName,
  pending,
  onChangeStage,
}: {
  entry: FundraisingPipelineEntry;
  investorName: string;
  pending: boolean;
  onChangeStage: (entryId: string, stage: PipelineStage) => void;
}) {
  const t = useTranslations("dashboard.investors");
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-aff-line bg-aff-bg p-3">
      <Link href={`/dashboard/investors/${entry.investorId}`} className="text-[13.5px] font-semibold text-aff-text hover:underline">
        {investorName}
      </Link>
      {entry.nextAction ? <p className="text-[12px] text-aff-muted">{entry.nextAction}</p> : null}
      <label className="sr-only" htmlFor={`stage-${entry.id}`}>
        {t("pipelineBoard.changeStage")}
      </label>
      <select
        id={`stage-${entry.id}`}
        value={entry.stage}
        disabled={pending}
        onChange={(e) => onChangeStage(entry.id, e.target.value as PipelineStage)}
        className="w-full rounded-lg border border-aff-line bg-aff-bg2 px-3 py-2 text-[12.5px] text-aff-text"
      >
        {PIPELINE_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {t(`pipelineStage.${stage}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

function PipelineBoard({
  pipeline,
  investorsById,
  onChangeStage,
  pending,
}: {
  pipeline: FundraisingPipelineEntry[];
  investorsById: Map<string, InvestorRecord>;
  onChangeStage: (entryId: string, stage: PipelineStage) => void;
  pending: boolean;
}) {
  const t = useTranslations("dashboard.investors");
  const [mobileStage, setMobileStage] = useState<"" | PipelineStage>("");

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, FundraisingPipelineEntry[]>();
    for (const stage of PIPELINE_STAGES) map.set(stage, []);
    for (const entry of pipeline) map.get(entry.stage)?.push(entry);
    return map;
  }, [pipeline]);

  const mobileList = mobileStage ? (byStage.get(mobileStage) ?? []) : pipeline;

  return (
    <div>
      {/* Desktop / tablet: stage-grouped columns (lightweight Kanban, no drag-and-drop). */}
      <div className="hidden gap-3 overflow-x-auto pb-2 md:flex">
        {PIPELINE_STAGES.map((stage) => {
          const entries = byStage.get(stage) ?? [];
          return (
            <div key={stage} className="flex w-[240px] shrink-0 flex-col gap-2 rounded-xl border border-aff-line bg-aff-bg2 p-3">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-aff-muted">
                {t(`pipelineStage.${stage}`)} <span className="text-aff-muted">({entries.length})</span>
              </p>
              {entries.length === 0 ? (
                <p className="text-[11.5px] text-aff-muted">{t("pipelineBoard.stageEmpty")}</p>
              ) : (
                entries.map((entry) => {
                  const record = investorsById.get(entry.investorId);
                  if (!record) return null;
                  return <PipelineEntryRow key={entry.id} entry={entry} investorName={record.organization.name} pending={pending} onChangeStage={onChangeStage} />;
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: stage filter + vertical list — never a wide horizontal board. */}
      <div className="md:hidden">
        <SelectField
          id="pipeline-mobile-stage-filter"
          label={t("pipelineBoard.stageFilterLabel")}
          value={mobileStage}
          onChange={(e) => setMobileStage(e.target.value as "" | PipelineStage)}
        >
          <option value="">{t("pipelineBoard.allStages")}</option>
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {t(`pipelineStage.${stage}`)} ({(byStage.get(stage) ?? []).length})
            </option>
          ))}
        </SelectField>
        <div className="mt-3 flex flex-col gap-2">
          {mobileList.length === 0 ? (
            <EmptyState title={t("pipelineBoard.stageEmpty")} />
          ) : (
            mobileList.map((entry) => {
              const record = investorsById.get(entry.investorId);
              if (!record) return null;
              return <PipelineEntryRow key={entry.id} entry={entry} investorName={record.organization.name} pending={pending} onChangeStage={onChangeStage} />;
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function InvestorsView({
  founderId,
  investors,
  dataByStartupId,
}: {
  founderId: string;
  investors: InvestorRecord[];
  dataByStartupId: Record<string, InvestorsStartupData>;
}) {
  const t = useTranslations("dashboard.investors");
  const { activeStartup } = useStartup();
  const [tab, setTab] = useState<Tab>("recommended");
  const [pending, startTransition] = useTransition();

  const data = dataByStartupId[activeStartup.id];
  const investorsById = useMemo(() => new Map(investors.map((r) => [r.organization.id, r])), [investors]);
  const matchByInvestorId = useMemo(() => new Map((data?.matches ?? []).map((m) => [m.investorId, m])), [data]);
  const shortlistedIds = useMemo(() => new Set((data?.shortlist ?? []).map((s) => s.investorId)), [data]);

  if (!data) {
    return <EmptyState title={t("empty.discover")} />;
  }

  const recommended = data.matches.filter((m) => m.recommended);

  function addToPipeline(investorId: string) {
    startTransition(async () => {
      await createPipelineEntryAction(activeStartup.id, { investorId, ownerFounderId: founderId });
    });
  }

  function changeStage(entryId: string, stage: PipelineStage) {
    startTransition(async () => {
      await moveStageAction(activeStartup.id, entryId, stage);
    });
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      <div className="rounded-xl border border-dashed border-aff-line bg-aff-bg2 px-4 py-2.5 text-[12.5px] text-aff-muted">{t("demoNotice")}</div>

      <div className="flex flex-wrap gap-2">
        {(["recommended", "discover", "shortlist", "pipeline"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors " +
              (tab === key ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted hover:text-aff-text")
            }
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === "recommended" ? (
        <DashboardSection title={t("tabs.recommended")}>
          {recommended.length === 0 ? (
            <EmptyState title={t("empty.recommended")} body={t("empty.recommendedBody")} />
          ) : (
            <div className="flex flex-col gap-3">
              {recommended.map((match) => {
                const record = investorsById.get(match.investorId);
                if (!record) return null;
                return (
                  <InvestorCard
                    key={match.investorId}
                    record={record}
                    match={match}
                    shortlisted={shortlistedIds.has(match.investorId)}
                    startupId={activeStartup.id}
                  />
                );
              })}
            </div>
          )}
        </DashboardSection>
      ) : null}

      {tab === "discover" ? (
        <DiscoverPanel
          startupId={activeStartup.id}
          investors={investors}
          matchByInvestorId={matchByInvestorId}
          shortlistedIds={shortlistedIds}
        />
      ) : null}

      {tab === "shortlist" ? (
        <DashboardSection title={t("tabs.shortlist")}>
          {data.shortlist.length === 0 ? (
            <EmptyState title={t("empty.shortlist")} body={t("empty.shortlistBody")} />
          ) : (
            <div className="flex flex-col gap-3">
              {data.shortlist.map((entry) => {
                const record = investorsById.get(entry.investorId);
                if (!record) return null;
                const inPipeline = data.pipeline.some((p) => p.investorId === entry.investorId);
                return (
                  <div key={entry.id} className="rounded-xl border border-aff-line bg-aff-bg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link href={`/dashboard/investors/${record.organization.id}`} className="font-heading text-[15px] font-semibold text-aff-text hover:underline">
                          {record.organization.name}
                        </Link>
                        <p className="text-[12.5px] text-aff-muted">
                          {t(`priority.${entry.priority}`)}
                          {entry.nextAction ? ` · ${entry.nextAction}` : ""}
                        </p>
                      </div>
                      {!inPipeline ? (
                        <Button variant="secondary" disabled={pending} onClick={() => addToPipeline(entry.investorId)} className="px-4 py-2 text-[12.5px]">
                          {t("profile.addToPipeline")}
                        </Button>
                      ) : null}
                    </div>
                    {entry.note ? <p className="mt-2 text-[13px] text-aff-text">{entry.note}</p> : null}
                  </div>
                );
              })}
            </div>
          )}
        </DashboardSection>
      ) : null}

      {tab === "pipeline" ? (
        <div className="flex flex-col gap-6">
          <RoundsSection startupId={activeStartup.id} rounds={data.rounds} />
          <DashboardSection title={t("tabs.pipeline")}>
            {data.pipeline.length === 0 ? (
              <EmptyState title={t("empty.pipeline")} body={t("empty.pipelineBody")} />
            ) : (
              <PipelineBoard pipeline={data.pipeline} investorsById={investorsById} onChangeStage={changeStage} pending={pending} />
            )}
          </DashboardSection>
        </div>
      ) : null}
    </div>
  );
}
