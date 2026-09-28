/**
 * Readiness assessment service boundary — the only place assessment
 * snapshots are created, read or completed. Backed by an in-memory store
 * seeded from lib/demo/readiness-assessments.ts (see PERSISTENCE_STATUS in
 * the batch report). UI components never call lib/readiness/scoring.ts or
 * lib/services/digital-twin.ts directly for assessment purposes — only
 * through the functions here.
 *
 * Completed assessments are never mutated in place: completeAssessment()
 * and reassess() always produce new array entries, so history stays intact.
 */
import { getDigitalTwin } from "@/lib/services/digital-twin";
import { evaluateAssessment } from "@/lib/readiness/scoring";
import { FRAMEWORK_VERSION } from "@/types/readiness-engine";
import type {
  AssessmentAnswerValue,
  DimensionKey,
  DimensionResult,
  ReadinessAssessment,
} from "@/types/readiness-engine";
import { seedReadinessAssessments } from "@/lib/demo/readiness-assessments";

const store = new Map<string, ReadinessAssessment[]>();

for (const [startupId, assessments] of Object.entries(seedReadinessAssessments())) {
  store.set(startupId, assessments);
}

function assessmentsFor(startupId: string): ReadinessAssessment[] {
  return store.get(startupId) ?? [];
}

export function getAssessmentHistory(startupId: string): ReadinessAssessment[] {
  return assessmentsFor(startupId)
    .filter((a) => a.status === "completed")
    .sort((a, b) => a.version - b.version);
}

export function getLatestAssessment(startupId: string): ReadinessAssessment | undefined {
  const history = getAssessmentHistory(startupId);
  return history[history.length - 1];
}

export function getDraftAssessment(startupId: string): ReadinessAssessment | undefined {
  return assessmentsFor(startupId).find((a) => a.status === "draft");
}

export function getDimensionResult(startupId: string, dimension: DimensionKey): DimensionResult | undefined {
  return getLatestAssessment(startupId)?.dimensions.find((d) => d.dimension === dimension);
}

export function createAssessment(startupId: string, nowIso: string): ReadinessAssessment {
  const existingDraft = getDraftAssessment(startupId);
  if (existingDraft) return existingDraft;

  const twin = getDigitalTwin(startupId);
  if (!twin) throw new Error(`No Digital Twin found for startup "${startupId}"`);

  const list = assessmentsFor(startupId);
  const nextVersion = list.reduce((max, a) => Math.max(max, a.version), 0) + 1;

  const draft: ReadinessAssessment = {
    id: `${startupId}-v${nextVersion}`,
    startupId,
    version: nextVersion,
    frameworkVersion: FRAMEWORK_VERSION,
    status: "draft",
    startupStageAtAssessment: twin.identity.stage,
    businessModelAtAssessment: twin.businessModel.types,
    startedAt: nowIso,
    overallScore: null,
    overallConfidence: 0,
    dimensions: [],
    answers: [],
    evidenceSnapshot: [],
  };

  store.set(startupId, [...list, draft]);
  return draft;
}

/** Alias — starting a reassessment is just creating a fresh draft alongside preserved history. */
export function reassess(startupId: string, nowIso: string): ReadinessAssessment {
  return createAssessment(startupId, nowIso);
}

export function saveAssessmentAnswers(
  startupId: string,
  answers: Record<string, AssessmentAnswerValue>,
  nowIso: string,
): ReadinessAssessment {
  const list = assessmentsFor(startupId);
  const draft = list.find((a) => a.status === "draft");
  if (!draft) throw new Error("No draft assessment in progress for this startup");

  const merged = new Map(draft.answers.map((a) => [a.questionId, a]));
  for (const [questionId, value] of Object.entries(answers)) {
    merged.set(questionId, { questionId, value, answeredAt: nowIso });
  }

  const updated: ReadinessAssessment = { ...draft, answers: Array.from(merged.values()) };
  store.set(
    startupId,
    list.map((a) => (a.id === draft.id ? updated : a)),
  );
  return updated;
}

export function completeAssessment(startupId: string, nowIso: string): ReadinessAssessment {
  const list = assessmentsFor(startupId);
  const draft = list.find((a) => a.status === "draft");
  if (!draft) throw new Error("No draft assessment in progress for this startup");

  const twin = getDigitalTwin(startupId);
  if (!twin) throw new Error(`No Digital Twin found for startup "${startupId}"`);

  const previous = getLatestAssessment(startupId);
  const previousByDim = previous
    ? (Object.fromEntries(previous.dimensions.map((d) => [d.dimension, d])) as Partial<
        Record<DimensionKey, DimensionResult>
      >)
    : undefined;

  const answersRecord: Record<string, AssessmentAnswerValue> = Object.fromEntries(
    draft.answers.map((a) => [a.questionId, a.value]),
  );

  const { overallScore, overallConfidence, dimensions } = evaluateAssessment(
    {
      twin,
      answers: answersRecord,
      stage: twin.identity.stage,
      businessModel: twin.businessModel.types,
      assessedAt: nowIso,
    },
    previousByDim,
  );

  const completed: ReadinessAssessment = {
    ...draft,
    status: "completed",
    completedAt: nowIso,
    overallScore,
    overallConfidence,
    dimensions,
    evidenceSnapshot: dimensions.flatMap((d) => d.criteria.flatMap((c) => c.evidence)),
  };

  store.set(
    startupId,
    list.map((a) => (a.id === draft.id ? completed : a)),
  );
  return completed;
}
