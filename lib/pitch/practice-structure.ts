/**
 * Recommended timed structure per practice format (Part 15) — static,
 * deterministic data. Section labels resolve through the same
 * dashboard.pitch.sections.<type>.title translation keys used everywhere
 * else, so nothing here duplicates founder-facing copy.
 */
import type { PitchPracticeFormat, PitchPracticeSegment } from "@/types/pitch";

function seg(sectionType: PitchPracticeSegment["sectionType"], startSeconds: number, endSeconds: number): PitchPracticeSegment {
  return { sectionType, startSeconds, endSeconds, labelKey: `dashboard.pitch.sections.${sectionType}.title` };
}

const STRUCTURES: Record<PitchPracticeFormat, PitchPracticeSegment[]> = {
  "30s": [seg("hook", 0, 8), seg("problem", 8, 16), seg("solution", 16, 24), seg("fundraising_ask", 24, 30)],
  "1min": [seg("hook", 0, 10), seg("problem", 10, 25), seg("solution", 25, 40), seg("traction", 40, 50), seg("fundraising_ask", 50, 60)],
  "3min": [
    seg("hook", 0, 20),
    seg("problem", 20, 50),
    seg("solution", 50, 80),
    seg("market", 80, 110),
    seg("traction", 110, 135),
    seg("business_model", 135, 160),
    seg("fundraising_ask", 160, 180),
  ],
  "5min": [
    seg("hook", 0, 20),
    seg("problem", 20, 60),
    seg("solution", 60, 100),
    seg("product", 100, 130),
    seg("market", 130, 170),
    seg("traction", 170, 210),
    seg("competition", 210, 240),
    seg("business_model", 240, 260),
    seg("team", 260, 280),
    seg("fundraising_ask", 280, 300),
  ],
};

export const FORMAT_DURATION_SECONDS: Record<PitchPracticeFormat, number> = {
  "30s": 30,
  "1min": 60,
  "3min": 180,
  "5min": 300,
};

export function recommendedStructure(format: PitchPracticeFormat): PitchPracticeSegment[] {
  return STRUCTURES[format];
}
