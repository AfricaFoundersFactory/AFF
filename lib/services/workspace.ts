/**
 * Workspace boundary: who the signed-in user is and which startups they can
 * switch between.
 *
 * Startup identity/stage data always comes from the LIVE Digital Twin
 * service (lib/services/digital-twin.ts), never a frozen demo snapshot —
 * this is what makes edits made through the Digital Twin service show up
 * immediately in the StartupSwitcher and Command Center. A future batch
 * replaces getWorkspaceContext()'s body with a real query scoped to the
 * signed-in session.
 */
import type { Startup, StartupMembership, User } from "@/types/domain";
import { demoUser, demoStartupIds, demoMemberships } from "@/lib/demo";
import { getDigitalTwin } from "@/lib/services/digital-twin";

export type WorkspaceContext = {
  user: User;
  startups: Startup[];
  memberships: StartupMembership[];
};

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const startups: Startup[] = demoStartupIds
    .map((id) => {
      const twin = getDigitalTwin(id);
      return twin ? { id, twin } : undefined;
    })
    .filter((s): s is Startup => s !== undefined);

  return {
    user: demoUser,
    startups,
    memberships: demoMemberships,
  };
}
