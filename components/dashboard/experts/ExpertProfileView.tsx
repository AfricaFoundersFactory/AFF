"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { EditPanel } from "@/components/dashboard/twin/EditPanel";
import { createSupportRequestAction } from "@/lib/actions/experts";
import { EXPERT_LANGUAGES } from "@/lib/experts/taxonomy";
import type { ExpertProfile, MatchReason, MentoringFormat, StartupNeed } from "@/types/experts";
import type { ExpertLanguage } from "@/lib/experts/taxonomy";

const FORMATS: MentoringFormat[] = ["VIDEO_CALL", "PHONE_CALL", "CHAT", "IN_PERSON", "DOCUMENT_REVIEW", "PITCH_REVIEW"];

/**
 * Reason `data` values are stable, locale-neutral ids/tokens (taxonomy ids,
 * StartupStage, ExpertLanguage) — lib/experts/matching.ts never translates
 * anything. Translation happens here, at render time only.
 */
function translateReasonData(
  reason: MatchReason,
  t: (key: string) => string,
  tStage: (key: string) => string,
): Record<string, string> | undefined {
  if (!reason.data) return undefined;
  if (reason.data.category) return { category: t(`expertise.${reason.data.category}`) };
  if (reason.data.industry) return { industry: t(`expertise.${reason.data.industry}`) };
  if (reason.data.stage) return { stage: tStage(reason.data.stage) };
  if (reason.data.language) return { language: t(`languages.${reason.data.language}`) };
  return reason.data;
}

export type ExpertProfileEntry = {
  reasons: MatchReason[];
  needs: StartupNeed[];
};

export function ExpertProfileView({
  expert,
  founderId,
  dataByStartupId,
}: {
  expert: ExpertProfile | undefined;
  founderId: string;
  dataByStartupId: Record<string, ExpertProfileEntry>;
}) {
  const { activeStartup } = useStartup();
  const t = useTranslations("dashboard.experts");
  const tRoot = useTranslations();
  const tStage = useTranslations("dashboard.stage");

  if (!expert) {
    return (
      <div className="mx-auto max-w-[800px]">
        <EmptyState title={t("profile.notFoundTitle")} body={t("profile.notFoundBody")} />
        <Link href="/dashboard/experts" className="mt-4 inline-block text-[13.5px] font-semibold text-aff-accent">
          {t("profile.backToDirectory")}
        </Link>
      </div>
    );
  }

  const entry = dataByStartupId[activeStartup.id];
  const reasons = entry?.reasons ?? [];
  const needs = entry?.needs.filter((n) => n.status === "OPEN") ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <Link href="/dashboard/experts" className="text-[12.5px] font-semibold text-aff-accent">
          {t("profile.backToDirectory")}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{expert.displayName}</h1>
          {expert.verificationStatus === "AFF_VERIFIED" ? (
            <span className="rounded-full bg-aff-cyan/15 px-2.5 py-1 text-[11px] font-semibold text-aff-cyan">
              {t("verification.AFF_VERIFIED")}
            </span>
          ) : expert.verificationStatus === "PROFILE_REVIEWED" ? (
            <span className="rounded-full border border-aff-line px-2.5 py-1 text-[11px] font-semibold text-aff-muted">
              {t("verification.PROFILE_REVIEWED")}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{expert.headline}</p>
        <p className="mt-1 text-[13px] text-aff-muted">
          {expert.city ? `${expert.city}, ` : ""}
          {expert.country}
        </p>
      </div>

      <DashboardSection title={t("profile.helpTitle")}>
        {reasons.length > 0 ? (
          <>
            <p className="mb-3 text-[13.5px] font-semibold text-aff-text">{t("matching.relevantCount", { count: reasons.length })}</p>
            <ul className="flex flex-col gap-1.5">
              {reasons.map((r) => (
                <li key={r.key} className="text-[13.5px] text-aff-text">
                  ✓ {tRoot(r.labelKey, translateReasonData(r, t, tStage))}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState title={t("profile.helpEmpty")} />
        )}
        <p className="mt-3 text-[11.5px] text-aff-muted">{t("matching.disclaimer")}</p>
      </DashboardSection>

      <DashboardSection title={t("profile.aboutTitle")}>
        <p className="text-[14px] leading-relaxed text-aff-text">{expert.bio}</p>
        {expert.currentRole || expert.organization ? (
          <p className="mt-3 text-[13px] text-aff-muted">
            {[expert.currentRole, expert.organization].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {expert.yearsExperience ? (
          <p className="mt-1 text-[13px] text-aff-muted">{t("profile.backgroundTitle")}: {expert.yearsExperience}+ yrs</p>
        ) : null}
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DashboardSection title={t("profile.expertiseTitle")}>
          <TagList items={expert.expertise.map((e) => t(`expertise.${e}`))} />
        </DashboardSection>
        <DashboardSection title={t("profile.industriesTitle")}>
          {expert.industries.length > 0 ? <TagList items={expert.industries.map((e) => t(`expertise.${e}`))} /> : <EmptyState title="—" />}
        </DashboardSection>
        <DashboardSection title={t("profile.stagesTitle")}>
          <TagList items={expert.startupStages.map((s) => tStage(s))} />
        </DashboardSection>
        <DashboardSection title={t("profile.marketsTitle")}>
          <TagList items={expert.markets} />
        </DashboardSection>
        <DashboardSection title={t("profile.languagesTitle")}>
          <TagList items={expert.languages.map((l) => t(`languages.${l}`))} />
        </DashboardSection>
        <DashboardSection title={t("profile.formatsTitle")}>
          <TagList items={expert.mentoringFormats.map((f) => t(`formats.${f}`))} />
        </DashboardSection>
      </div>

      <DashboardSection title={t("profile.availabilityTitle")}>
        <p className="text-[14px] text-aff-text">{t(`availability.${expert.availability}`)}</p>
        {expert.hoursPerMonth ? <p className="mt-1 text-[13px] text-aff-muted">{expert.hoursPerMonth} h / month</p> : null}
      </DashboardSection>

      <RequestSupportSection startupId={activeStartup.id} founderId={founderId} expert={expert} needs={needs} />
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return <EmptyState title="—" />;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-aff-line px-2.5 py-1 text-[12px] text-aff-text">
          {item}
        </span>
      ))}
    </div>
  );
}

function RequestSupportSection({
  startupId,
  founderId,
  expert,
  needs,
}: {
  startupId: string;
  founderId: string;
  expert: ExpertProfile;
  needs: StartupNeed[];
}) {
  const t = useTranslations("dashboard.experts");
  const tRoot = useTranslations();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [saving, startSaving] = useTransition();
  const [form, setForm] = useState<{
    topic: string;
    message: string;
    preferredFormat: MentoringFormat;
    preferredLanguage: ExpertLanguage;
    needId: string;
  }>({
    topic: "",
    message: "",
    preferredFormat: expert.mentoringFormats[0] ?? "VIDEO_CALL",
    preferredLanguage: expert.languages[0] ?? "en",
    needId: "",
  });

  function handleSend() {
    if (!form.topic.trim() || !form.message.trim()) return;
    startSaving(async () => {
      await createSupportRequestAction(startupId, {
        founderId,
        expertId: expert.id,
        needId: form.needId || undefined,
        topic: form.topic,
        message: form.message,
        preferredFormat: form.preferredFormat,
        preferredLanguage: form.preferredLanguage,
      });
      setOpen(false);
      setSent(true);
      setForm({ topic: "", message: "", preferredFormat: expert.mentoringFormats[0] ?? "VIDEO_CALL", preferredLanguage: expert.languages[0] ?? "en", needId: "" });
    });
  }

  return (
    <DashboardSection title={t("request.title")}>
      {sent ? (
        <div>
          <p className="mb-1 text-[14px] font-semibold text-aff-text">{t("request.successTitle")}</p>
          <p className="mb-4 text-[13.5px] text-aff-muted">{t("request.successBody")}</p>
          <Link href="/dashboard/experts/requests" className="text-[13.5px] font-semibold text-aff-accent">
            {t("requestsPage.pageTitle")}
          </Link>
        </div>
      ) : (
        <Button className="px-5 py-3 text-[13.5px]" onClick={() => setOpen(true)}>
          {t("profile.requestCta")}
        </Button>
      )}

      <EditPanel
        open={open}
        title={t("request.title")}
        onClose={() => setOpen(false)}
        onSave={handleSend}
        saving={saving}
        saveLabel={t("request.submit")}
        cancelLabel={t("request.cancel")}
      >
        <p className="text-[12.5px] text-aff-muted">{t("request.sentNotice")}</p>
        <TextField id="request-topic" label={t("request.topicLabel")} value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
        <div>
          <label htmlFor="request-message" className="mb-2 block text-[13px] font-semibold text-aff-muted">
            {t("request.messageLabel")}
          </label>
          <textarea
            id="request-message"
            rows={4}
            className="w-full rounded-lg border border-aff-line bg-aff-bg2 px-4 py-3.5 text-[15px] text-aff-text placeholder:text-aff-muted focus:border-aff-accent"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
        </div>
        <SelectField
          id="request-format"
          label={t("request.formatLabel")}
          value={form.preferredFormat}
          onChange={(e) => setForm((f) => ({ ...f, preferredFormat: e.target.value as MentoringFormat }))}
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {t(`formats.${f}`)}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="request-language"
          label={t("request.languageLabel")}
          value={form.preferredLanguage}
          onChange={(e) => setForm((f) => ({ ...f, preferredLanguage: e.target.value as ExpertLanguage }))}
        >
          {EXPERT_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {t(`languages.${l}`)}
            </option>
          ))}
        </SelectField>
        {needs.length > 0 ? (
          <SelectField id="request-need" label={t("request.needLabel")} value={form.needId} onChange={(e) => setForm((f) => ({ ...f, needId: e.target.value }))}>
            <option value="">{t("request.needNone")}</option>
            {needs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title.startsWith("dashboard.") ? tRoot(n.title) : n.title}
              </option>
            ))}
          </SelectField>
        ) : null}
      </EditPanel>
    </DashboardSection>
  );
}
