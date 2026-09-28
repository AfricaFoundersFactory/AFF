// Pure privacy resolver — the ONLY function allowed to decide what of a
// startup is shown inside Community. Deterministic, no AI, no side effects.
//
// This is cosmetic/display logic only — it never grants access to
// anything. It reads from a StartupIdentity (public-safe Digital Twin
// fields only, never financials/cash/runway/Data Room/expert notes/
// messages/readiness evidence) and a StartupCommunitySettings record and
// returns strictly the allowed subset. See community-privacy.test.ts.
import type { StartupCommunityVisibility } from "@/types/community";

export type PublicStartupSummarySource = {
  name: string;
  tagline?: string;
  industry?: string;
  stage?: string;
};

export type PublicStartupView =
  | { visible: false }
  | { visible: true; visibility: "NAME_ONLY"; name: string }
  | { visible: true; visibility: "SUMMARY"; name: string; tagline?: string; industry?: string; stage?: string };

export function resolveStartupExposure(
  settings: { showStartupInCommunity: boolean; startupVisibility: StartupCommunityVisibility } | undefined,
  identity: PublicStartupSummarySource,
): PublicStartupView {
  if (!settings || !settings.showStartupInCommunity || settings.startupVisibility === "HIDDEN") {
    return { visible: false };
  }
  if (settings.startupVisibility === "NAME_ONLY") {
    return { visible: true, visibility: "NAME_ONLY", name: identity.name };
  }
  // SUMMARY — still an explicit allow-list, never a passthrough of the
  // whole identity object (which may later grow more sensitive fields).
  return {
    visible: true,
    visibility: "SUMMARY",
    name: identity.name,
    tagline: identity.tagline,
    industry: identity.industry,
    stage: identity.stage,
  };
}
