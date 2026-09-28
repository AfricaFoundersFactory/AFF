/**
 * Pitch Live readiness foundation (Part 23) — deterministic, transparent
 * PRODUCT PREPARATION requirements. This is explicitly NOT an investment
 * judgment and NOT derived solely from the 0-100 Pitch Readiness score —
 * see PitchLiveReadiness.ready below and the UI copy at
 * messages/{en,fr}.json → dashboard.pitch.live.disclaimer, which must keep
 * stating that distinction.
 */
import type { PitchLiveReadiness, PitchReview, PitchVersion, PitchPracticeAttempt } from "@/types/pitch";

export function computePitchLiveReadiness(
  version: PitchVersion | undefined,
  reviews: PitchReview[],
  practiceAttempts: PitchPracticeAttempt[],
): PitchLiveReadiness {
  if (!version) {
    return {
      requirements: {
        versionFinalized: false,
        requiredSectionsComplete: false,
        noCriticalUnresolvedIssue: false,
        hasPracticeAttempt: false,
      },
      ready: false,
    };
  }

  const requiredSections = version.sections.filter((s) => s.required);
  const requiredSectionsComplete =
    requiredSections.length > 0 && requiredSections.every((s) => s.status === "complete" || s.content.trim().length > 0);

  const openCriticalIssues = reviews
    .flatMap((r) => r.comments)
    .some((c) => c.type === "critical_issue" && c.status === "open");

  const hasPracticeAttempt = practiceAttempts.some((a) => a.pitchVersionId === version.id && a.completedAt);

  const requirements = {
    versionFinalized: version.status === "final",
    requiredSectionsComplete,
    noCriticalUnresolvedIssue: !openCriticalIssues,
    hasPracticeAttempt,
  };

  const ready = Object.values(requirements).every(Boolean);

  return { requirements, ready };
}
