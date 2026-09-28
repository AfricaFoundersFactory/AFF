// Pure, deterministic notification preference defaults — no side effects.
// EMAIL always defaults to disabled: there is no real email provider wired
// up (see types/settings.ts#SettingsCapabilityFlags), so the honest default
// is "off" rather than implying a channel that doesn't work yet.
import type { NotificationEventFamily, NotificationPreference } from "@/types/settings";

export const NOTIFICATION_FAMILIES: NotificationEventFamily[] = [
  "EXPERT_REQUESTS",
  "MESSAGES",
  "OPPORTUNITIES",
  "COMMUNITY_REPLIES",
  "EVENTS",
  "ROADMAP_TASK_REMINDERS",
];

export function defaultNotificationPreferences(): NotificationPreference[] {
  const prefs: NotificationPreference[] = [];
  for (const family of NOTIFICATION_FAMILIES) {
    prefs.push({ channel: "IN_APP", family, enabled: true });
    prefs.push({ channel: "EMAIL", family, enabled: false });
  }
  return prefs;
}
