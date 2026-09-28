"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  updatePrivacyPreferencesAction,
  updateNotificationPreferenceAction,
  updateStartupCommunitySettingsAction,
} from "@/lib/actions/settings";
import type { SessionUser } from "@/lib/auth/session";
import type { CommunityProfileVisibility, StartupCommunityVisibility } from "@/types/community";
import type { FounderSettings, NotificationEventFamily, SettingsCapabilityFlags, StartupCommunitySettings } from "@/types/settings";

export type SettingsViewData = {
  user: SessionUser;
  founderSettings: FounderSettings;
  startupSettingsById: Record<string, StartupCommunitySettings>;
  capabilityFlags: SettingsCapabilityFlags;
};

const PROFILE_VISIBILITIES: CommunityProfileVisibility[] = ["PRIVATE", "COMMUNITY", "PUBLIC"];
const STARTUP_VISIBILITIES: StartupCommunityVisibility[] = ["HIDDEN", "NAME_ONLY", "SUMMARY"];
const NOTIFICATION_FAMILIES: NotificationEventFamily[] = [
  "EXPERT_REQUESTS",
  "MESSAGES",
  "OPPORTUNITIES",
  "COMMUNITY_REPLIES",
  "EVENTS",
  "ROADMAP_TASK_REMINDERS",
];

export function SettingsView({ data }: { data: SettingsViewData }) {
  const t = useTranslations("dashboard.settings");
  const { activeStartup } = useStartup();
  const [pending, startTransition] = useTransition();
  const [founderSettings, setFounderSettings] = useState(data.founderSettings);
  const [startupSettings, setStartupSettings] = useState(data.startupSettingsById[activeStartup.id]);

  function notifPref(channel: "IN_APP" | "EMAIL", family: NotificationEventFamily) {
    return founderSettings.notificationPreferences.find((p) => p.channel === channel && p.family === family)?.enabled ?? false;
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardSection title={t("sections.personal")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11.5px] font-semibold tracking-[0.06em] text-aff-muted">{t("personal.name").toUpperCase()}</p>
            <p className="mt-1 text-[14px] text-aff-text">{data.user.name}</p>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold tracking-[0.06em] text-aff-muted">{t("personal.email").toUpperCase()}</p>
            <p className="mt-1 text-[14px] text-aff-text">{data.user.email}</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-aff-muted">{t("personal.digitalTwinHint")}</p>
      </DashboardSection>

      <DashboardSection title={t("sections.language")}>
        <p className="mb-3 text-[12.5px] text-aff-muted">{t("language.hint")}</p>
        <LanguageSwitcher />
      </DashboardSection>

      <DashboardSection title={t("sections.privacy")}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px]">
            <span className="font-semibold text-aff-text">{t("privacy.profileVisibility")}</span>
            <select
              value={founderSettings.profileVisibility}
              disabled={pending}
              onChange={(e) => {
                const profileVisibility = e.target.value as CommunityProfileVisibility;
                setFounderSettings((s) => ({ ...s, profileVisibility }));
                startTransition(async () => {
                  await updatePrivacyPreferencesAction(data.user.id, { profileVisibility });
                });
              }}
              className="w-fit rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-aff-text"
            >
              {PROFILE_VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {t(`privacy.visibilityOptions.${v}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-[13px] text-aff-text">
            <input
              type="checkbox"
              checked={founderSettings.allowCommunityDiscovery}
              disabled={pending}
              onChange={(e) => {
                const allowCommunityDiscovery = e.target.checked;
                setFounderSettings((s) => ({ ...s, allowCommunityDiscovery }));
                startTransition(async () => {
                  await updatePrivacyPreferencesAction(data.user.id, { allowCommunityDiscovery });
                });
              }}
            />
            {t("privacy.allowCommunityDiscovery")}
          </label>

          <label className="flex items-center gap-2 text-[13px] text-aff-text">
            <input
              type="checkbox"
              checked={founderSettings.allowExpertDiscovery}
              disabled={pending}
              onChange={(e) => {
                const allowExpertDiscovery = e.target.checked;
                setFounderSettings((s) => ({ ...s, allowExpertDiscovery }));
                startTransition(async () => {
                  await updatePrivacyPreferencesAction(data.user.id, { allowExpertDiscovery });
                });
              }}
            />
            {t("privacy.allowExpertDiscovery")}
          </label>
        </div>
      </DashboardSection>

      <DashboardSection title={t("sections.community")}>
        <p className="mb-3 text-[12.5px] text-aff-muted">{t("community.startupScopedHint", { startup: activeStartup.twin.identity.name })}</p>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-[13px] text-aff-text">
            <input
              type="checkbox"
              checked={startupSettings.showStartupInCommunity}
              disabled={pending}
              onChange={(e) => {
                const showStartupInCommunity = e.target.checked;
                setStartupSettings((s) => ({ ...s, showStartupInCommunity }));
                startTransition(async () => {
                  await updateStartupCommunitySettingsAction(activeStartup.id, { showStartupInCommunity });
                });
              }}
            />
            {t("community.showStartup")}
          </label>

          <label className="flex flex-col gap-1.5 text-[13px]">
            <span className="font-semibold text-aff-text">{t("community.startupVisibility")}</span>
            <select
              value={startupSettings.startupVisibility}
              disabled={pending || !startupSettings.showStartupInCommunity}
              onChange={(e) => {
                const startupVisibility = e.target.value as StartupCommunityVisibility;
                setStartupSettings((s) => ({ ...s, startupVisibility }));
                startTransition(async () => {
                  await updateStartupCommunitySettingsAction(activeStartup.id, { startupVisibility });
                });
              }}
              className="w-fit rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-aff-text disabled:opacity-50"
            >
              {STARTUP_VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {t(`community.visibilityOptions.${v}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-[13px] text-aff-text">
            <input
              type="checkbox"
              checked={startupSettings.showEventParticipation}
              disabled={pending}
              onChange={(e) => {
                const showEventParticipation = e.target.checked;
                setStartupSettings((s) => ({ ...s, showEventParticipation }));
                startTransition(async () => {
                  await updateStartupCommunitySettingsAction(activeStartup.id, { showEventParticipation });
                });
              }}
            />
            {t("community.showEventParticipation")}
          </label>
        </div>
      </DashboardSection>

      <DashboardSection title={t("sections.notifications")}>
        <p className="mb-3 text-[12.5px] text-aff-muted">{t("notifications.emailUnsupportedNotice")}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-[12.5px]">
            <thead>
              <tr className="text-aff-muted">
                <th className="py-1.5 font-semibold">{t("notifications.family")}</th>
                <th className="py-1.5 font-semibold">{t("notifications.inApp")}</th>
                <th className="py-1.5 font-semibold">{t("notifications.email")}</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_FAMILIES.map((family) => (
                <tr key={family} className="border-t border-aff-line">
                  <td className="py-2 text-aff-text">{t(`notifications.families.${family}`)}</td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={notifPref("IN_APP", family)}
                      disabled={pending}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setFounderSettings((s) => ({
                          ...s,
                          notificationPreferences: s.notificationPreferences.map((p) => (p.channel === "IN_APP" && p.family === family ? { ...p, enabled } : p)),
                        }));
                        startTransition(async () => {
                          await updateNotificationPreferenceAction(data.user.id, "IN_APP", family, enabled);
                        });
                      }}
                    />
                  </td>
                  <td className="py-2">
                    <input type="checkbox" checked={false} disabled title={t("notifications.emailUnsupportedNotice")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection title={t("sections.security")}>
        <p className="text-[12.5px] text-aff-muted">{t("security.notice")}</p>
      </DashboardSection>

      <DashboardSection title={t("sections.account")}>
        <div className="flex flex-col gap-2 text-[12.5px] text-aff-muted">
          <p>{t("account.exportUnavailable")}</p>
          <p>{t("account.deleteUnavailable")}</p>
          <p>{t("account.persistenceNotice")}</p>
        </div>
      </DashboardSection>
    </div>
  );
}
