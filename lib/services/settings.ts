/**
 * Founder Settings service boundary — the only place a FounderSettings
 * (user-scoped) or StartupCommunitySettings (startup-scoped) record is
 * created, read or mutated. Same Map-based pattern as
 * lib/services/messages.ts.
 *
 * CRITICAL: the startup-scoped store MUST stay isolated per startupId (see
 * settings-isolation.test.ts) and neither store is ever used as an
 * authorization mechanism — it only ever changes what's shown, never what
 * a service call is allowed to read/write. See lib/settings/privacy.ts.
 */
import type { FounderSettings, NotificationEventFamily, NotificationPreference, SettingsCapabilityFlags, StartupCommunitySettings } from "@/types/settings";
import type { CommunityProfileVisibility, StartupCommunityVisibility } from "@/types/community";
import { defaultNotificationPreferences } from "@/lib/settings/notifications";

const userSettingsStore = new Map<string, FounderSettings>();
const startupSettingsStore = new Map<string, StartupCommunitySettings>();

// Static, honest capability flags — never toggled by the user.
export const SETTINGS_CAPABILITY_FLAGS: SettingsCapabilityFlags = {
  emailNotificationsOperational: false,
  passwordChangeOperational: false,
  dataExportOperational: false,
  accountDeletionOperational: false,
  settingsPersistBeyondServerMemory: false,
};

// ---------------------------------------------------------------------------
// User-scoped
// ---------------------------------------------------------------------------

export function getOrCreateFounderSettings(userId: string, language: "fr" | "en", nowIso: string): FounderSettings {
  const existing = userSettingsStore.get(userId);
  if (existing) return existing;
  const settings: FounderSettings = {
    userId,
    language,
    profileVisibility: "COMMUNITY",
    allowCommunityDiscovery: true,
    allowExpertDiscovery: true,
    notificationPreferences: defaultNotificationPreferences(),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  userSettingsStore.set(userId, settings);
  return settings;
}

export function updateLanguagePreference(userId: string, language: "fr" | "en", nowIso: string): FounderSettings {
  const existing = getOrCreateFounderSettings(userId, language, nowIso);
  const updated: FounderSettings = { ...existing, language, updatedAt: nowIso };
  userSettingsStore.set(userId, updated);
  return updated;
}

export function updatePrivacyPreferences(
  userId: string,
  patch: Partial<Pick<FounderSettings, "profileVisibility" | "allowCommunityDiscovery" | "allowExpertDiscovery">>,
  nowIso: string,
): FounderSettings {
  const existing = getOrCreateFounderSettings(userId, "fr", nowIso);
  const updated: FounderSettings = { ...existing, ...patch, updatedAt: nowIso };
  userSettingsStore.set(userId, updated);
  return updated;
}

export function updateNotificationPreference(
  userId: string,
  channel: NotificationPreference["channel"],
  family: NotificationEventFamily,
  enabled: boolean,
  nowIso: string,
): FounderSettings {
  const existing = getOrCreateFounderSettings(userId, "fr", nowIso);
  const notificationPreferences = existing.notificationPreferences.map((p) =>
    p.channel === channel && p.family === family ? { ...p, enabled } : p,
  );
  const updated: FounderSettings = { ...existing, notificationPreferences, updatedAt: nowIso };
  userSettingsStore.set(userId, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Startup-scoped — never shared across startups.
// ---------------------------------------------------------------------------

export function getOrCreateStartupCommunitySettings(startupId: string, nowIso: string): StartupCommunitySettings {
  const existing = startupSettingsStore.get(startupId);
  if (existing) return existing;
  const settings: StartupCommunitySettings = {
    startupId,
    // Off by default — exposing a startup in Community is opt-in.
    showStartupInCommunity: false,
    startupVisibility: "HIDDEN",
    showEventParticipation: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  startupSettingsStore.set(startupId, settings);
  return settings;
}

export function updateStartupCommunitySettings(
  startupId: string,
  patch: Partial<Pick<StartupCommunitySettings, "showStartupInCommunity" | "startupVisibility" | "showEventParticipation">>,
  nowIso: string,
): StartupCommunitySettings {
  const existing = getOrCreateStartupCommunitySettings(startupId, nowIso);
  const updated: StartupCommunitySettings = { ...existing, ...patch, updatedAt: nowIso };
  startupSettingsStore.set(startupId, updated);
  return updated;
}

export type { StartupCommunityVisibility, CommunityProfileVisibility };

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetSettingsStoreForTests() {
  userSettingsStore.clear();
  startupSettingsStore.clear();
}
