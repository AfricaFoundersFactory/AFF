"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { filterOpportunities, type OpportunityFilters } from "@/lib/opportunities/filtering";
import {
  createPrepTaskAction,
  saveOpportunityAction,
  unsaveOpportunityAction,
  upsertApplicationAction,
} from "@/lib/actions/opportunities";
import type {
  OpportunityApplication,
  OpportunityApplicationStatus,
  OpportunityMatch,
  OpportunityType,
  SavedOpportunity,
} from "@/types/opportunity";

export type OpportunityWorkspaceEntry = {
  matches: OpportunityMatch[];
  saved: SavedOpportunity[];
  applications: OpportunityApplication[];
};

const TYPES: OpportunityType[] = [
  "ACCELERATOR",
  "INCUBATOR",
  "GRANT",
  "COMPETITION",
  "PITCH_EVENT",
  "FUNDING_CALL",
  "CORPORATE_PROGRAM",
  "PUBLIC_PROGRAM",
  "TRAINING",
  "NETWORKING",
  "OTHER",
];
const APPLICATION_STATUSES: OpportunityApplicationStatus[] = [
  "INTERESTED",
  "PREPARING",
  "APPLIED",
  "SHORTLISTED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

type Tab = "recommended" | "all" | "saved" | "applications";

export function OpportunityWorkspaceView({ dataByStartupId }: { dataByStartupId: Record<string, OpportunityWorkspaceEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.opportunities");
  const tRoot = useTranslations();
  const format = useFormatter();
  const [tab, setTab] = useState<Tab>("recommended");
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});
  const [applicationOverrides, setApplicationOverrides] = useState<Record<string, OpportunityApplication>>({});

  const matches = useMemo(() => entry?.matches ?? [], [entry]);
  const savedIds = new Set(entry?.saved.map((s) => s.opportunityId) ?? []);
  const applicationsByOpportunity = new Map((entry?.applications ?? []).map((a) => [a.opportunityId, a]));

  const isSaved = (id: string) => savedOverrides[id] ?? savedIds.has(id);
  const applicationFor = (id: string) => applicationOverrides[id] ?? applicationsByOpportunity.get(id);

  const filteredOpportunities = useMemo(
    () => filterOpportunities(matches.map((m) => m.opportunity), filters),
    [matches, filters],
  );
  const filteredIds = new Set(filteredOpportunities.map((o) => o.id));

  let visible: OpportunityMatch[];
  if (tab === "recommended") {
    visible = matches.filter((m) => filteredIds.has(m.opportunity.id) && m.reasons.filter((r) => r.kind === "MATCH").length >= 2);
  } else if (tab === "saved") {
    visible = matches.filter((m) => filteredIds.has(m.opportunity.id) && isSaved(m.opportunity.id));
  } else if (tab === "applications") {
    visible = matches.filter((m) => filteredIds.has(m.opportunity.id) && Boolean(applicationFor(m.opportunity.id)));
  } else {
    visible = matches.filter((m) => filteredIds.has(m.opportunity.id));
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
        <p className="mt-2 text-[12px] text-aff-muted">{t("demoDisclaimer")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["recommended", "all", "saved", "applications"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
              tab === tabKey ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted hover:text-aff-text"
            }`}
          >
            {t(`tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      <DashboardSection title={t("filtersTitle")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            id="opp-search"
            label={t("filters.search")}
            value={filters.search ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
          />
          <SelectField
            id="opp-type"
            label={t("filters.type")}
            value={filters.type ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, type: (e.target.value || undefined) as OpportunityType | undefined }))}
          >
            <option value="">{t("filters.any")}</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </SelectField>
          <TextField
            id="opp-country"
            label={t("filters.country")}
            value={filters.country ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value || undefined }))}
          />
          <TextField
            id="opp-industry"
            label={t("filters.industry")}
            value={filters.industry ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value || undefined }))}
          />
        </div>
      </DashboardSection>

      <DashboardSection title={t(`tabs.${tab}`)}>
        {visible.length === 0 ? (
          <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visible.map((match) => (
              <OpportunityListCard
                key={match.opportunity.id}
                match={match}
                startupId={activeStartup.id}
                saved={isSaved(match.opportunity.id)}
                application={applicationFor(match.opportunity.id)}
                onToggleSaved={(saved) => setSavedOverrides((prev) => ({ ...prev, [match.opportunity.id]: saved }))}
                onApplicationChange={(app) => setApplicationOverrides((prev) => ({ ...prev, [match.opportunity.id]: app }))}
                t={t}
                tRoot={tRoot}
                format={format}
              />
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}

function OpportunityListCard({
  match,
  startupId,
  saved,
  application,
  onToggleSaved,
  onApplicationChange,
  t,
  tRoot,
  format,
}: {
  match: OpportunityMatch;
  startupId: string;
  saved: boolean;
  application: OpportunityApplication | undefined;
  onToggleSaved: (saved: boolean) => void;
  onApplicationChange: (application: OpportunityApplication) => void;
  t: ReturnType<typeof useTranslations>;
  tRoot: ReturnType<typeof useTranslations>;
  format: ReturnType<typeof useFormatter>;
}) {
  const { opportunity, reasons } = match;
  const matchReasons = reasons.filter((r) => r.kind === "MATCH");
  const mismatchReasons = reasons.filter((r) => r.kind === "MISMATCH");
  const [pending, startTransition] = useTransition();
  const [taskCreated, setTaskCreated] = useState(Boolean(application?.taskId));

  function toggleSave() {
    startTransition(async () => {
      const result = saved ? await unsaveOpportunityAction(startupId, opportunity.id) : await saveOpportunityAction(startupId, opportunity.id);
      if (result.ok) onToggleSaved(!saved);
    });
  }

  function handleStatusChange(status: OpportunityApplicationStatus) {
    startTransition(async () => {
      const result = await upsertApplicationAction(startupId, opportunity.id, { status, deadline: opportunity.deadline });
      if (result.ok) onApplicationChange(result.data);
    });
  }

  function handleAddPrepTask() {
    if (!application) return;
    startTransition(async () => {
      const result = await createPrepTaskAction(startupId, application.id);
      if (result.ok) setTaskCreated(true);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-aff-line p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-[15px] font-semibold text-aff-text">{opportunity.title}</h3>
          <p className="text-[12.5px] text-aff-muted">{opportunity.organization}</p>
        </div>
        <button
          onClick={toggleSave}
          disabled={pending}
          className={`shrink-0 rounded-full border px-3 py-1 text-[11.5px] font-semibold ${
            saved ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted hover:text-aff-text"
          }`}
        >
          {saved ? t("saved") : t("save")}
        </button>
      </div>

      <p className="text-[13px] text-aff-muted">{opportunity.description.en}</p>

      <div className="flex flex-wrap gap-2 text-[11.5px] text-aff-muted">
        <span className="rounded-full border border-aff-line px-2 py-0.5">{t(`types.${opportunity.type}`)}</span>
        {opportunity.deadline && (
          <span className="rounded-full border border-aff-line px-2 py-0.5">
            {t("deadline")}: {format.dateTime(new Date(opportunity.deadline), { month: "short", day: "numeric", year: "numeric" })}
          </span>
        )}
        {opportunity.fundingAmount && (
          <span className="rounded-full border border-aff-line px-2 py-0.5">
            {opportunity.fundingAmount.amount.toLocaleString()} {opportunity.fundingAmount.currency}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {matchReasons.map((r) => (
          <p key={r.key} className="text-[12.5px] text-aff-text">
            ✓ {tRoot(r.labelKey, r.data)}
          </p>
        ))}
        {mismatchReasons.map((r) => (
          <p key={r.key} className="text-[12.5px] text-amber-500">
            ✗ {tRoot(r.labelKey, r.data)}
          </p>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-aff-line pt-3">
        <label className="text-[11.5px] font-semibold text-aff-muted" htmlFor={`status-${opportunity.id}`}>
          {t("applicationStatus")}:
        </label>
        <select
          id={`status-${opportunity.id}`}
          value={application?.status ?? ""}
          disabled={pending}
          onChange={(e) => handleStatusChange(e.target.value as OpportunityApplicationStatus)}
          className="rounded-lg border border-aff-line bg-aff-bg2 px-2 py-1.5 text-[12.5px] text-aff-text"
        >
          <option value="" disabled>
            {t("filters.any")}
          </option>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`applicationStatuses.${status}`)}
            </option>
          ))}
        </select>
        {application && !taskCreated && (
          <Button variant="secondary" className="px-3 py-1.5 text-[12px]" disabled={pending} onClick={handleAddPrepTask}>
            {t("addPrepTask")}
          </Button>
        )}
        {taskCreated && <span className="text-[11.5px] text-aff-accent">{t("prepTaskAdded")}</span>}
      </div>
      <p className="text-[10.5px] text-aff-muted">{t("selfReportedNotice")}</p>
    </div>
  );
}
