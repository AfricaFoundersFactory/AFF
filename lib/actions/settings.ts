"use server";

/**
 * Server Action boundary for Founder Settings — the only way client
 * components change language/privacy/notification preferences (user-scoped)
 * or a startup's Community visibility (startup-scoped). Delegates entirely
 * to lib/services/settings.ts. These are cosmetic/community-facing
 * preferences only — they never bypass service-layer startup isolation.
 */
import { revalidatePath } from "next/cache";
import * as settingsService from "@/lib/services/settings";
import type { FounderSettings, NotificationEventFamily, StartupCommunitySettings } from "@/types/settings";
import type { CommunityProfileVisibility, StartupCommunityVisibility } from "@/types/community";

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function guard<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    revalidateDashboard();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateLanguagePreferenceAction(userId: string, language: "fr" | "en"): Promise<Result<FounderSettings>> {
  return guard(() => settingsService.updateLanguagePreference(userId, language, nowIso()));
}

export async function updatePrivacyPreferencesAction(
  userId: string,
  patch: { profileVisibility?: CommunityProfileVisibility; allowCommunityDiscovery?: boolean; allowExpertDiscovery?: boolean },
): Promise<Result<FounderSettings>> {
  return guard(() => settingsService.updatePrivacyPreferences(userId, patch, nowIso()));
}

export async function updateNotificationPreferenceAction(
  userId: string,
  channel: "IN_APP" | "EMAIL",
  family: NotificationEventFamily,
  enabled: boolean,
): Promise<Result<FounderSettings>> {
  return guard(() => settingsService.updateNotificationPreference(userId, channel, family, enabled, nowIso()));
}

export async function updateStartupCommunitySettingsAction(
  startupId: string,
  patch: { showStartupInCommunity?: boolean; startupVisibility?: StartupCommunityVisibility; showEventParticipation?: boolean },
): Promise<Result<StartupCommunitySettings>> {
  return guard(() => settingsService.updateStartupCommunitySettings(startupId, patch, nowIso()));
}
