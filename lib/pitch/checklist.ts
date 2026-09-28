/**
 * Pitch Checklist (Part 14) — deterministic derivation from pitch data.
 * Nothing here is hardcoded in the UI: components only render the
 * ChecklistItem[] this file returns. Reuses the same section/evidence
 * signals as lib/pitch/readiness.ts, but the checklist is presented as
 * discrete pass/warn/fail items rather than a 0-100 score.
 */
import type { ChecklistItem, PitchVersion } from "@/types/pitch";

function section(version: PitchVersion, type: string) {
  return version.sections.find((s) => s.type === type);
}

export function deriveChecklist(version: PitchVersion): ChecklistItem[] {
  const problem = section(version, "problem");
  const solution = section(version, "solution");
  const traction = section(version, "traction");
  const team = section(version, "team");
  const ask = section(version, "fundraising_ask");
  const requiredSections = version.sections.filter((s) => s.required);
  const incompleteRequired = requiredSections.filter((s) => !s.content.trim() && s.keyPoints.length === 0);

  const items: ChecklistItem[] = [
    {
      key: "problem_defined",
      state: problem && problem.content.trim().length > 0 ? "pass" : "fail",
      labelKey: "dashboard.pitch.checklist.problem_defined",
    },
    {
      key: "solution_defined",
      state: solution && solution.content.trim().length > 0 ? "pass" : "fail",
      labelKey: "dashboard.pitch.checklist.solution_defined",
    },
    {
      key: "traction_evidence",
      state: !traction ? "fail" : traction.sourceReferences.length > 0 ? "pass" : traction.content.trim() ? "warn" : "fail",
      labelKey: "dashboard.pitch.checklist.traction_evidence",
    },
    {
      key: "team_present",
      state: team && team.content.trim().length > 0 ? "pass" : "warn",
      labelKey: "dashboard.pitch.checklist.team_present",
    },
    {
      key: "ask_clear",
      state: ask && ask.content.trim().length > 0 ? "pass" : "fail",
      labelKey: "dashboard.pitch.checklist.ask_clear",
    },
    {
      key: "required_sections_complete",
      state: incompleteRequired.length === 0 ? "pass" : incompleteRequired.length <= 2 ? "warn" : "fail",
      labelKey: "dashboard.pitch.checklist.required_sections_complete",
    },
  ];

  return items;
}
