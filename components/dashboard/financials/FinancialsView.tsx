"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { EditPanel } from "@/components/dashboard/twin/EditPanel";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { formatMoney } from "@/lib/format";
import { projectForecastCash } from "@/lib/financials/calculations";
import { validateAllocation } from "@/lib/financials/funding";
import { upsertPeriodAction, setForecastAction, setFundingRequirementAction, setCashPositionAction } from "@/lib/actions/financials";
import type { FinancialProfile, FinancialSignal, UseOfFundsCategory } from "@/types/financials";
import type { FinancialSnapshot } from "@/lib/services/financials";
import type { FundingInstrument, FundingStatus } from "@/types/digital-twin";

export type FinancialsPageEntry = {
  profile: FinancialProfile;
  snapshot: FinancialSnapshot;
};

const ALLOCATION_CATEGORIES: UseOfFundsCategory[] = [
  "product",
  "hiring",
  "sales",
  "marketing",
  "operations",
  "expansion",
  "equipment",
  "regulatory",
  "working_capital",
  "other",
];
const INSTRUMENTS: FundingInstrument[] = ["equity", "safe", "convertible_note", "debt", "grant", "revenue_based_financing", "other"];
const FUNDING_STATUSES: FundingStatus[] = ["not_raising", "raising", "closed"];

export function FinancialsView({ dataByStartupId }: { dataByStartupId: Record<string, FinancialsPageEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.financials");
  const locale = useLocale();
  const router = useRouter();

  if (!entry) {
    return <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />;
  }

  const { profile, snapshot } = entry;
  const money = (v: number | null) => (v === null ? "—" : formatMoney(v, snapshot.currency, locale));

  const runwayValue =
    snapshot.runway.status === "calculated"
      ? t("metrics.runwayMonths", { months: Math.round(snapshot.runway.months * 10) / 10 })
      : snapshot.runway.status === "sustainable"
        ? t("metrics.runwaySustainable")
        : "—";
  const runwayHint = snapshot.runway.status === "unavailable" ? t(`metrics.runwayUnavailable.${snapshot.runway.reason}`) : undefined;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      {/* Top metrics — the 6 questions a founder must be able to answer instantly. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label={t("metrics.cashBalance")} value={money(snapshot.cashBalance)} hint={snapshot.cashBalance === null ? t("metrics.cashBalanceUnavailable") : undefined} />
        <MetricCard label={t("metrics.monthlyRevenue")} value={money(snapshot.monthlyRevenue)} hint={snapshot.monthlyRevenue === null ? t("metrics.noHistoryYet") : undefined} />
        <MetricCard label={t("metrics.monthlyExpenses")} value={money(snapshot.monthlyExpenses)} hint={snapshot.monthlyExpenses === null ? t("metrics.noHistoryYet") : undefined} />
        <MetricCard label={t("metrics.netBurn")} value={money(snapshot.netBurn)} />
        <MetricCard label={t("metrics.runway")} value={runwayValue} hint={runwayHint} />
      </div>

      <SignalsSection signals={snapshot.signals} />

      <HistorySection startupId={activeStartup.id} profile={profile} currency={snapshot.currency} onSaved={() => router.refresh()} />

      <ForecastSection startupId={activeStartup.id} profile={profile} currency={snapshot.currency} onSaved={() => router.refresh()} />

      <FundingRequirementSection startupId={activeStartup.id} profile={profile} currency={snapshot.currency} onSaved={() => router.refresh()} />

      <CashPositionSection startupId={activeStartup.id} currency={snapshot.currency} cashBalance={snapshot.cashBalance} onSaved={() => router.refresh()} />
    </div>
  );
}

function severityClasses(severity: FinancialSignal["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "warning":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default:
      return "border-aff-line bg-aff-bg text-aff-muted";
  }
}

function SignalsSection({ signals }: { signals: FinancialSignal[] }) {
  const t = useTranslations("dashboard.financials");
  return (
    <DashboardSection title={t("signals.title")}>
      {signals.length === 0 ? (
        <p className="text-[13.5px] text-aff-muted">{t("signals.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {signals.map((signal, i) => (
            <li key={`${signal.key}-${i}`} className={`rounded-lg border px-4 py-3 text-[13.5px] ${severityClasses(signal.severity)}`}>
              {t(`signals.messages.${signal.key}`, signal.data)}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[12px] text-aff-muted">{t("signals.disclaimer")}</p>
    </DashboardSection>
  );
}

function HistorySection({
  startupId,
  profile,
  currency,
  onSaved,
}: {
  startupId: string;
  profile: FinancialProfile;
  currency: string;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.financials");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const [form, setForm] = useState({ month: "", revenue: "", directCosts: "", payroll: "", marketing: "", operations: "", other: "", cashClosing: "" });

  const sorted = [...profile.periods].sort((a, b) => (a.month < b.month ? 1 : -1));

  function handleSave() {
    if (!form.month.trim()) return;
    const num = (v: string) => (v.trim() ? Number(v) : 0);
    startSaving(async () => {
      await upsertPeriodAction(startupId, {
        month: form.month,
        revenue: num(form.revenue) > 0 ? [{ id: crypto.randomUUID(), label: "Revenue", amount: { amount: num(form.revenue), currency }, recurring: true }] : [],
        expenses: [
          { id: crypto.randomUUID(), category: "direct_costs" as const, label: "Direct costs", amount: { amount: num(form.directCosts), currency } },
          { id: crypto.randomUUID(), category: "payroll" as const, label: "Payroll", amount: { amount: num(form.payroll), currency } },
          { id: crypto.randomUUID(), category: "marketing" as const, label: "Marketing", amount: { amount: num(form.marketing), currency } },
          { id: crypto.randomUUID(), category: "operations" as const, label: "Operations", amount: { amount: num(form.operations), currency } },
          { id: crypto.randomUUID(), category: "other" as const, label: "Other", amount: { amount: num(form.other), currency } },
        ].filter((e) => e.amount.amount > 0),
        cashClosingBalance: form.cashClosing.trim() ? { amount: num(form.cashClosing), currency } : undefined,
      });
      setOpen(false);
      setForm({ month: "", revenue: "", directCosts: "", payroll: "", marketing: "", operations: "", other: "", cashClosing: "" });
      onSaved();
    });
  }

  return (
    <DashboardSection
      title={t("history.title")}
      action={
        <Button variant="secondary" className="px-4 py-2 text-[12.5px]" onClick={() => setOpen(true)}>
          {t("history.addPeriod")}
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyState title={t("history.emptyTitle")} body={t("history.emptyBody")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-aff-line text-aff-muted">
                <th className="py-2 pr-4 font-semibold">{t("history.columns.month")}</th>
                <th className="py-2 pr-4 font-semibold">{t("history.columns.revenue")}</th>
                <th className="py-2 pr-4 font-semibold">{t("history.columns.expenses")}</th>
                <th className="py-2 font-semibold">{t("history.columns.cash")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const revenueTotal = p.revenue.reduce((s, r) => s + r.amount.amount, 0);
                const expenseTotal = p.expenses.reduce((s, e) => s + e.amount.amount, 0);
                return (
                  <tr key={p.id} className="border-b border-aff-line/60 text-aff-text last:border-0">
                    <td className="py-2.5 pr-4">{p.month}</td>
                    <td className="py-2.5 pr-4">{formatMoney(revenueTotal, currency, locale)}</td>
                    <td className="py-2.5 pr-4">{formatMoney(expenseTotal, currency, locale)}</td>
                    <td className="py-2.5">{p.cashClosingBalance ? formatMoney(p.cashClosingBalance.amount, currency, locale) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EditPanel
        open={open}
        title={t("history.addPeriod")}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        saving={saving}
        saveLabel={t("form.save")}
        cancelLabel={t("form.cancel")}
      >
        <TextField id="period-month" label={t("history.columns.month")} placeholder="2026-09" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
        <TextField id="period-revenue" label={t("history.columns.revenue")} type="number" min={0} value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} />
        <TextField id="period-direct" label={t("history.expenseCategories.direct_costs")} type="number" min={0} value={form.directCosts} onChange={(e) => setForm((f) => ({ ...f, directCosts: e.target.value }))} />
        <TextField id="period-payroll" label={t("history.expenseCategories.payroll")} type="number" min={0} value={form.payroll} onChange={(e) => setForm((f) => ({ ...f, payroll: e.target.value }))} />
        <TextField id="period-marketing" label={t("history.expenseCategories.marketing")} type="number" min={0} value={form.marketing} onChange={(e) => setForm((f) => ({ ...f, marketing: e.target.value }))} />
        <TextField id="period-operations" label={t("history.expenseCategories.operations")} type="number" min={0} value={form.operations} onChange={(e) => setForm((f) => ({ ...f, operations: e.target.value }))} />
        <TextField id="period-other" label={t("history.expenseCategories.other")} type="number" min={0} value={form.other} onChange={(e) => setForm((f) => ({ ...f, other: e.target.value }))} />
        <TextField id="period-cash" label={t("history.columns.cash")} type="number" min={0} value={form.cashClosing} onChange={(e) => setForm((f) => ({ ...f, cashClosing: e.target.value }))} />
      </EditPanel>
    </DashboardSection>
  );
}

function ForecastSection({
  startupId,
  profile,
  currency,
  onSaved,
}: {
  startupId: string;
  profile: FinancialProfile;
  currency: string;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.financials");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const [form, setForm] = useState({ month: "", revenue: "", expenses: "", assumptions: "" });

  const forecast = profile.forecast;
  const projection = forecast ? projectForecastCash(forecast.startingCashBalance?.amount, forecast.periods) : [];

  function handleAddMonth() {
    if (!form.month.trim()) return;
    startSaving(async () => {
      const assumptions = form.assumptions
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .map((text) => ({ id: crypto.randomUUID(), text }));
      const newPeriod = {
        id: crypto.randomUUID(),
        month: form.month,
        projectedRevenue: { amount: form.revenue.trim() ? Number(form.revenue) : 0, currency },
        projectedExpenses: { amount: form.expenses.trim() ? Number(form.expenses) : 0, currency },
        assumptions,
      };
      await setForecastAction(startupId, {
        startingCashBalance: forecast?.startingCashBalance,
        periods: [...(forecast?.periods ?? []), newPeriod],
      });
      setOpen(false);
      setForm({ month: "", revenue: "", expenses: "", assumptions: "" });
      onSaved();
    });
  }

  return (
    <DashboardSection
      title={t("forecast.title")}
      action={
        <Button variant="secondary" className="px-4 py-2 text-[12.5px]" onClick={() => setOpen(true)}>
          {t("forecast.addMonth")}
        </Button>
      }
    >
      {!forecast || forecast.periods.length === 0 ? (
        <EmptyState title={t("forecast.emptyTitle")} body={t("forecast.emptyBody")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-aff-line text-aff-muted">
                <th className="py-2 pr-4 font-semibold">{t("history.columns.month")}</th>
                <th className="py-2 pr-4 font-semibold">{t("forecast.columns.projectedRevenue")}</th>
                <th className="py-2 pr-4 font-semibold">{t("forecast.columns.projectedExpenses")}</th>
                <th className="py-2 pr-4 font-semibold">{t("forecast.columns.projectedCash")}</th>
                <th className="py-2 font-semibold">{t("forecast.columns.assumptions")}</th>
              </tr>
            </thead>
            <tbody>
              {forecast.periods.map((p, i) => (
                <tr key={p.id} className="border-b border-aff-line/60 text-aff-text last:border-0">
                  <td className="py-2.5 pr-4">{p.month}</td>
                  <td className="py-2.5 pr-4">{formatMoney(p.projectedRevenue.amount, currency, locale)}</td>
                  <td className="py-2.5 pr-4">{formatMoney(p.projectedExpenses.amount, currency, locale)}</td>
                  <td className="py-2.5 pr-4">{projection[i]?.projectedCash !== null && projection[i]?.projectedCash !== undefined ? formatMoney(projection[i]!.projectedCash!, currency, locale) : "—"}</td>
                  <td className="py-2.5 text-aff-muted">{p.assumptions.map((a) => a.text).join("; ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[12px] text-aff-muted">{t("forecast.disclaimer")}</p>

      <EditPanel
        open={open}
        title={t("forecast.addMonth")}
        onClose={() => setOpen(false)}
        onSave={handleAddMonth}
        saving={saving}
        saveLabel={t("form.save")}
        cancelLabel={t("form.cancel")}
      >
        <TextField id="forecast-month" label={t("history.columns.month")} placeholder="2026-10" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
        <TextField id="forecast-revenue" label={t("forecast.columns.projectedRevenue")} type="number" min={0} value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} />
        <TextField id="forecast-expenses" label={t("forecast.columns.projectedExpenses")} type="number" min={0} value={form.expenses} onChange={(e) => setForm((f) => ({ ...f, expenses: e.target.value }))} />
        <TextField id="forecast-assumptions" label={t("forecast.assumptionsLabel")} placeholder={t("forecast.assumptionsPlaceholder")} value={form.assumptions} onChange={(e) => setForm((f) => ({ ...f, assumptions: e.target.value }))} />
      </EditPanel>
    </DashboardSection>
  );
}

function FundingRequirementSection({
  startupId,
  profile,
  currency,
  onSaved,
}: {
  startupId: string;
  profile: FinancialProfile;
  currency: string;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.financials");
  const tCategory = useTranslations("dashboard.financials.fundingRequirement.categories");
  const tInstrument = useTranslations("dashboard.digitalTwin.enums.fundingInstrument");
  const tStatus = useTranslations("dashboard.digitalTwin.enums.fundingStatus");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const fr = profile.fundingRequirement;

  const [form, setForm] = useState(() => ({
    amount: fr ? String(fr.amountSought.amount) : "",
    instrument: (fr?.instrument ?? "equity") as FundingInstrument,
    targetDate: fr?.targetDate ?? "",
    runwayExtension: fr?.intendedRunwayExtensionMonths ? String(fr.intendedRunwayExtensionMonths) : "",
    status: (fr?.status ?? "raising") as FundingStatus,
    allocations: Object.fromEntries(ALLOCATION_CATEGORIES.map((c) => [c, fr?.allocation.find((a) => a.category === c)?.percentage?.toString() ?? ""])),
  }));

  const validation = fr ? validateAllocation(fr.allocation, fr.amountSought) : undefined;

  function handleSave() {
    startSaving(async () => {
      const allocation = ALLOCATION_CATEGORIES.filter((c) => form.allocations[c]?.trim())
        .map((c) => ({ id: crypto.randomUUID(), category: c, percentage: Number(form.allocations[c]) }));
      await setFundingRequirementAction(startupId, {
        amountSought: { amount: Number(form.amount || 0), currency },
        instrument: form.instrument,
        targetDate: form.targetDate.trim() || undefined,
        intendedRunwayExtensionMonths: form.runwayExtension.trim() ? Number(form.runwayExtension) : undefined,
        allocation,
        status: form.status,
      });
      setOpen(false);
      onSaved();
    });
  }

  return (
    <DashboardSection
      title={t("fundingRequirement.title")}
      action={
        <Button variant="secondary" className="px-4 py-2 text-[12.5px]" onClick={() => setOpen(true)}>
          {fr ? t("form.edit") : t("fundingRequirement.define")}
        </Button>
      }
    >
      {!fr ? (
        <EmptyState title={t("fundingRequirement.emptyTitle")} body={t("fundingRequirement.emptyBody")} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label={t("fundingRequirement.amountSought")} value={formatMoney(fr.amountSought.amount, currency, locale)} />
            <MetricCard label={t("fundingRequirement.instrumentLabel")} value={tInstrument(fr.instrument)} />
            <MetricCard label={t("fundingRequirement.statusLabel")} value={tStatus(fr.status)} />
            <MetricCard label={t("fundingRequirement.runwayExtensionLabel")} value={fr.intendedRunwayExtensionMonths ? t("metrics.runwayMonths", { months: fr.intendedRunwayExtensionMonths }) : "—"} />
          </div>
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-aff-muted">{t("fundingRequirement.allocationTitle")}</h3>
            <ul className="flex flex-col gap-1.5">
              {fr.allocation.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-[13.5px] text-aff-text">
                  <span>{tCategory(a.category)}</span>
                  <span className="text-aff-muted">{a.percentage !== undefined ? `${a.percentage}%` : a.amount ? formatMoney(a.amount.amount, currency, locale) : "—"}</span>
                </li>
              ))}
            </ul>
            {validation && !validation.valid ? (
              <p className="mt-2 text-[12.5px] text-amber-400">{t(`fundingRequirement.validation.${validation.reason}`)}</p>
            ) : null}
          </div>
        </div>
      )}

      <EditPanel
        open={open}
        title={t("fundingRequirement.title")}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        saving={saving}
        saveLabel={t("form.save")}
        cancelLabel={t("form.cancel")}
      >
        <TextField id="fr-amount" label={t("fundingRequirement.amountSought")} type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
        <SelectField id="fr-instrument" label={t("fundingRequirement.instrumentLabel")} value={form.instrument} onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value as FundingInstrument }))}>
          {INSTRUMENTS.map((i) => (
            <option key={i} value={i}>
              {tInstrument(i)}
            </option>
          ))}
        </SelectField>
        <SelectField id="fr-status" label={t("fundingRequirement.statusLabel")} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FundingStatus }))}>
          {FUNDING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </SelectField>
        <TextField id="fr-target-date" label={t("fundingRequirement.targetDateLabel")} type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} />
        <TextField id="fr-runway" label={t("fundingRequirement.runwayExtensionLabel")} type="number" min={0} value={form.runwayExtension} onChange={(e) => setForm((f) => ({ ...f, runwayExtension: e.target.value }))} />
        <div>
          <p className="mb-2 text-[13px] font-semibold text-aff-muted">{t("fundingRequirement.allocationTitle")} ({t("fundingRequirement.allocationHint")})</p>
          <div className="grid grid-cols-2 gap-3">
            {ALLOCATION_CATEGORIES.map((c) => (
              <TextField
                key={c}
                id={`fr-alloc-${c}`}
                label={tCategory(c)}
                type="number"
                min={0}
                max={100}
                value={form.allocations[c]}
                onChange={(e) => setForm((f) => ({ ...f, allocations: { ...f.allocations, [c]: e.target.value } }))}
              />
            ))}
          </div>
        </div>
      </EditPanel>
    </DashboardSection>
  );
}

function CashPositionSection({
  startupId,
  currency,
  cashBalance,
  onSaved,
}: {
  startupId: string;
  currency: string;
  cashBalance: number | null;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard.financials");
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const [value, setValue] = useState(cashBalance !== null ? String(cashBalance) : "");

  function handleSave() {
    startSaving(async () => {
      await setCashPositionAction(startupId, { asOfDate: new Date().toISOString(), balance: { amount: Number(value || 0), currency } });
      setOpen(false);
      onSaved();
    });
  }

  return (
    <DashboardSection
      title={t("cashPosition.title")}
      action={
        <Button variant="secondary" className="px-4 py-2 text-[12.5px]" onClick={() => setOpen(true)}>
          {t("form.edit")}
        </Button>
      }
    >
      <p className="text-[13.5px] text-aff-muted">{t("cashPosition.description")}</p>
      <EditPanel open={open} title={t("cashPosition.title")} onClose={() => setOpen(false)} onSave={handleSave} saving={saving} saveLabel={t("form.save")} cancelLabel={t("form.cancel")}>
        <TextField id="cash-balance" label={t("metrics.cashBalance")} type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
      </EditPanel>
    </DashboardSection>
  );
}
