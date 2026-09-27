import { ScoreDimension } from "./ScoreDimension";
import type { ScoreDimension as ScoreDimensionType } from "@/types/scoring";

export function ScoreBreakdown({ dimensions }: { dimensions: ScoreDimensionType[] }) {
  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-5">
      {dimensions.map((dim) => (
        <ScoreDimension key={dim.label} label={dim.label} pct={dim.pct} />
      ))}
    </div>
  );
}
