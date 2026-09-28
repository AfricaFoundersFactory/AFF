"use client";

import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/Button";

export function ProfileCompletionBar({ pct, label }: { pct: number; label: string }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-aff-muted">{label}</span>
        <span className="font-heading text-lg font-semibold text-aff-text">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-aff-line/50">
        <div
          className="h-full rounded-full bg-aff-cyan transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function MissingInfoList({
  title,
  items,
  emptyLabel,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div>
      <div className="mb-3 text-[13px] font-semibold text-aff-muted">{title}</div>
      {items.length > 0 ? (
        <ul className="mb-4 flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[13.5px] text-aff-text">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-[13.5px] text-aff-muted">{emptyLabel}</p>
      )}
      {ctaLabel && ctaHref ? (
        <ButtonLink href={ctaHref} variant="secondary" className="px-4 py-2.5 text-[13px]">
          {ctaLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}

export function SectionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div role="tablist" aria-label="My Startup sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-aff-line">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === active}
          onClick={() => onChange(tab.key)}
          className={cn(
            "shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-[13.5px] font-semibold transition-colors",
            tab.key === active
              ? "border-aff-accent text-aff-text"
              : "border-transparent text-aff-muted hover:text-aff-text",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-aff-line py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between">
      <span className="text-[12.5px] font-semibold text-aff-muted">{label}</span>
      <span className="text-[14px] text-aff-text sm:text-right">{value}</span>
    </div>
  );
}

export function SectionCard({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-aff-line bg-aff-bg2 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-[13px] font-semibold tracking-[0.08em] text-aff-muted">
          {title.toUpperCase()}
        </h2>
        {onEdit && editLabel ? (
          <Button type="button" variant="ghost" onClick={onEdit} className="px-3 py-1.5 text-[12.5px]">
            {editLabel}
          </Button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ItemCard({
  title,
  subtitle,
  onEdit,
  onRemove,
  editLabel,
  removeLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  onEdit: () => void;
  onRemove: () => void;
  editLabel: string;
  removeLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-aff-line bg-aff-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold text-aff-text">{title}</div>
          {subtitle ? <div className="text-[12.5px] text-aff-muted">{subtitle}</div> : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" onClick={onEdit} className="px-2.5 py-1.5 text-[12px]">
            {editLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={onRemove} className="px-2.5 py-1.5 text-[12px] text-red-400">
            {removeLabel}
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
