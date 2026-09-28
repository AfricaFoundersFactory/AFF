import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetSettingsStoreForTests,
  getOrCreateFounderSettings,
  getOrCreateStartupCommunitySettings,
  SETTINGS_CAPABILITY_FLAGS,
  updateLanguagePreference,
  updateNotificationPreference,
  updatePrivacyPreferences,
  updateStartupCommunitySettings,
} from "./settings";

describe("settings service", () => {
  beforeEach(() => {
    __resetSettingsStoreForTests();
  });

  it("creates default founder settings with a safe default community visibility and EMAIL disabled by default", () => {
    const settings = getOrCreateFounderSettings("u1", "en", "2026-01-01T00:00:00.000Z");
    expect(settings.profileVisibility).toBe("COMMUNITY");
    for (const pref of settings.notificationPreferences) {
      if (pref.channel === "EMAIL") expect(pref.enabled).toBe(false);
    }
  });

  it("updates language preference (user-scoped)", () => {
    getOrCreateFounderSettings("u1", "fr", "2026-01-01T00:00:00.000Z");
    const updated = updateLanguagePreference("u1", "en", "2026-01-02T00:00:00.000Z");
    expect(updated.language).toBe("en");
  });

  it("updates privacy preferences (user-scoped, not startup-scoped)", () => {
    const updated = updatePrivacyPreferences("u1", { profileVisibility: "PRIVATE", allowCommunityDiscovery: false }, "2026-01-01T00:00:00.000Z");
    expect(updated.profileVisibility).toBe("PRIVATE");
    expect(updated.allowCommunityDiscovery).toBe(false);
  });

  it("updates a single notification preference without disturbing others", () => {
    getOrCreateFounderSettings("u1", "en", "2026-01-01T00:00:00.000Z");
    const updated = updateNotificationPreference("u1", "IN_APP", "MESSAGES", false, "2026-01-02T00:00:00.000Z");
    const messagesPref = updated.notificationPreferences.find((p) => p.channel === "IN_APP" && p.family === "MESSAGES");
    const expertPref = updated.notificationPreferences.find((p) => p.channel === "IN_APP" && p.family === "EXPERT_REQUESTS");
    expect(messagesPref?.enabled).toBe(false);
    expect(expertPref?.enabled).toBe(true);
  });

  it("startup community settings default to HIDDEN/off (opt-in only) and are startup-scoped", () => {
    const a = getOrCreateStartupCommunitySettings("startup-a", "2026-01-01T00:00:00.000Z");
    expect(a.showStartupInCommunity).toBe(false);
    expect(a.startupVisibility).toBe("HIDDEN");

    updateStartupCommunitySettings("startup-a", { showStartupInCommunity: true, startupVisibility: "SUMMARY" }, "2026-01-02T00:00:00.000Z");
    const b = getOrCreateStartupCommunitySettings("startup-b", "2026-01-01T00:00:00.000Z");

    expect(b.showStartupInCommunity).toBe(false); // never leaked from startup-a
    expect(b.startupVisibility).toBe("HIDDEN");
  });

  it("is honest about EMAIL, security and account controls being unsupported", () => {
    expect(SETTINGS_CAPABILITY_FLAGS.emailNotificationsOperational).toBe(false);
    expect(SETTINGS_CAPABILITY_FLAGS.passwordChangeOperational).toBe(false);
    expect(SETTINGS_CAPABILITY_FLAGS.dataExportOperational).toBe(false);
    expect(SETTINGS_CAPABILITY_FLAGS.accountDeletionOperational).toBe(false);
    expect(SETTINGS_CAPABILITY_FLAGS.settingsPersistBeyondServerMemory).toBe(false);
  });
});
