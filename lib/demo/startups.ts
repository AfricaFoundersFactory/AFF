/**
 * Isolated demo dataset — Founder Workspace.
 *
 * Nothing here is real user data. It exists only so the dashboard UI can be
 * built and visually validated before a real database/API exists. Every
 * dashboard page must read this data through lib/services/*, never import
 * from lib/demo directly, so the demo provider can be swapped for a real one
 * without touching any component.
 */
import type { StartupMembership, User } from "@/types/domain";
import { demoDigitalTwins } from "./digital-twin";

export const demoUser: User = {
  id: "user-demo-1",
  name: "Amara Diallo",
  email: "amara@wakama.africa",
  roles: ["founder"],
};

// A startup's identity/stage/etc. live entirely on its Digital Twin. This
// list only seeds which startup ids exist — lib/services/workspace.ts
// combines it with the LIVE digital-twin service (not this frozen demo
// object) so mutations are always reflected, never a stale snapshot.
export const demoStartupIds: string[] = Object.keys(demoDigitalTwins);

export const demoMemberships: StartupMembership[] = [
  { id: "mem-1", userId: demoUser.id, startupId: "startup-wakama", role: "owner" },
  { id: "mem-2", userId: demoUser.id, startupId: "startup-solari", role: "owner" },
];
