/**
 * Dependency-graph validation shared by the generator and by the
 * roadmap-item/task update actions, so a cycle can never be accepted
 * through either path.
 */
import type { RoadmapItem } from "@/types/roadmap";

type DependencyBearing = { id: string; dependencies?: string[] };

/**
 * True if adding an edge fromId -> toId (fromId depends on toId) would
 * create a cycle in the dependency graph described by `items`. Walks
 * forward from `toId` through existing dependency edges; if it ever
 * reaches `fromId`, the new edge would close a loop.
 */
export function wouldCreateCycle<T extends DependencyBearing>(items: T[], fromId: string, toId: string): boolean {
  if (fromId === toId) return true;

  const byId = new Map(items.map((i) => [i.id, i]));
  const visited = new Set<string>();
  const stack = [toId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === fromId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const deps = byId.get(current)?.dependencies ?? [];
    for (const dep of deps) stack.push(dep);
  }

  return false;
}

export function validateDependencies(items: RoadmapItem[]): { valid: boolean; cycleItemIds: string[] } {
  const cycleItemIds: string[] = [];
  // Structural check: for every item, walking its dependency chain must
  // never revisit itself.
  for (const item of items) {
    const visited = new Set<string>();
    const stack = [...(item.dependencies ?? [])];
    const byId = new Map(items.map((i) => [i.id, i]));
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === item.id) {
        cycleItemIds.push(item.id);
        break;
      }
      if (visited.has(current)) continue;
      visited.add(current);
      const deps = byId.get(current)?.dependencies ?? [];
      for (const dep of deps) stack.push(dep);
    }
  }
  return { valid: cycleItemIds.length === 0, cycleItemIds };
}
