// Founder Settings domain model (AFF-DASH-09 Part C).
//
// CRITICAL distinction: FounderSettings is USER-scoped (a person's own
// preferences — language, notification channels, personal community
// discovery toggles). StartupCommunitySettings is STARTUP-scoped (whether
// THIS startup is visible in Community, and how). Keeping these as two
// separate types (rather than one bag of "settings") is deliberate — it
// makes the user-vs-startup isolation boundary explicit in the type model
// itself, per the work order's "make this distinction explicit" requirement.
//
// A visibility preference here is COSMETIC/community-facing only. It must
// never be treated as an authorization mechanism — startup data isolation
// is enforced entirely in the service layer (lib/services/*.ts), never by
// a settings flag. See lib/settings/privacy.ts.

import type { CommunityProfileVisibility, StartupCommunityVisibility } from "./community";

export type NotificationChannel = "IN_APP" | "EMAIL";

// EMAIL has no real provider wired up — lib/services/settings.ts and the
// Settings UI must always present EMAIL as unsupported/future, never as
// operational, regardless of the stored preference value.
export type NotificationEventFamily =
  | "EXPERT_REQUESTS"
  | "MESSAGES"
  | "OPPORTUNITIES"
  | "COMMUNITY_REPLIES"
  | "EVENTS"
  | "ROADMAP_TASK_REMINDERS";

export type NotificationPreference = {
  channel: NotificationChannel;
  family: NotificationEventFamily;
  enabled: boolean;
};

// USER-SCOPED. Persists only in server memory for this demo (no database),
// and the Settings UI must say so honestly rather than implying durability
// across restarts.
export type FounderSettings = {
  userId: string;
  language: "fr" | "en";
  profileVisibility: CommunityProfileVisibility;
  allowCommunityDiscovery: boolean;
  allowExpertDiscovery: boolean;
  notificationPreferences: NotificationPreference[];
  createdAt: string;
  updatedAt: string;
};

// STARTUP-SCOPED. Must never leak between startups (see
// settings-isolation.test.ts) and must never be read/written by any code
// path that bypasses lib/services/settings.ts.
export type StartupCommunitySettings = {
  startupId: string;
  showStartupInCommunity: boolean;
  startupVisibility: StartupCommunityVisibility;
  showEventParticipation: boolean;
  createdAt: string;
  updatedAt: string;
};

// Static, honest capability flags for foundation-only sections. These are
// never toggled by the user — they describe what the platform currently
// supports, so the UI can render an honest "not yet available" state
// instead of a fake working control.
export type SettingsCapabilityFlags = {
  emailNotificationsOperational: false;
  passwordChangeOperational: false;
  dataExportOperational: false;
  accountDeletionOperational: false;
  settingsPersistBeyondServerMemory: false;
};
