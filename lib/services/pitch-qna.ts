/**
 * Investor Q&A preparation service boundary (Part 17). Same
 * Map<startupId, ...> pattern as the other pitch services. Question
 * SELECTION is computed by lib/pitch/qna-selector.ts (pure, deterministic);
 * this file only stores the founder's own answer drafts/status per
 * question id.
 */
import type { QnaAnswerState, QnaAnswerStatus } from "@/types/pitch";

const store = new Map<string, QnaAnswerState[]>();

function answersFor(startupId: string): QnaAnswerState[] {
  return store.get(startupId) ?? [];
}

function save(startupId: string, answers: QnaAnswerState[]) {
  store.set(startupId, answers);
}

export function listAnswers(startupId: string): QnaAnswerState[] {
  return answersFor(startupId);
}

export function saveAnswer(startupId: string, questionId: string, answer: string, nowIso: string): QnaAnswerState {
  const existing = answersFor(startupId);
  const updated: QnaAnswerState = {
    questionId,
    answer,
    status: answer.trim() ? "drafted" : "not_started",
    updatedAt: nowIso,
  };
  const has = existing.some((a) => a.questionId === questionId);
  save(startupId, has ? existing.map((a) => (a.questionId === questionId ? updated : a)) : [...existing, updated]);
  return updated;
}

export function setAnswerStatus(startupId: string, questionId: string, status: QnaAnswerStatus, nowIso: string): QnaAnswerState {
  const existing = answersFor(startupId);
  const current = existing.find((a) => a.questionId === questionId);
  const updated: QnaAnswerState = { questionId, answer: current?.answer ?? "", status, updatedAt: nowIso };
  save(startupId, current ? existing.map((a) => (a.questionId === questionId ? updated : a)) : [...existing, updated]);
  return updated;
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetPitchQnaStoreForTests() {
  store.clear();
}
