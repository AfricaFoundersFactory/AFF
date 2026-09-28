// Core account/organization domain model for the authenticated platform.
//
// A user is never assumed to equal a startup: a person can own or belong to
// several startups, sit on several teams, and hold different roles on each
// (see StartupMembership). All dashboard data must be scoped through a
// membership + active startup, never through the signed-in user alone.

import type { StartupDigitalTwin } from "./digital-twin";

export type { StartupStage } from "./common";

export type PlatformRole = "founder" | "expert" | "investor" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: PlatformRole[];
};

export type MembershipRole = "owner" | "admin" | "member" | "viewer";

export type StartupMembership = {
  id: string;
  userId: string;
  startupId: string;
  role: MembershipRole;
};

// A startup's only identity fields live on its Digital Twin
// (twin.identity) — nothing here duplicates name/stage/sector/country, so
// there is exactly one source of truth for that data.
export type Startup = {
  id: string;
  twin: StartupDigitalTwin;
};
