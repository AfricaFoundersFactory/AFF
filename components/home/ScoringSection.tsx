import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ScoreOverview } from "@/components/scoring/ScoreOverview";
import { ScoreBreakdown } from "@/components/scoring/ScoreBreakdown";
import { ScoringExplanation } from "@/components/scoring/ScoringExplanation";
import type { ScoreDimension } from "@/types/scoring";

export async function ScoringSection() {
  const t = await getTranslations("home.scoring");
  const dimensions = t.raw("dimensions") as ScoreDimension[];
  const demoScoreValue = t.raw("demoScoreValue") as number;
  const demoScoreMax = t.raw("demoScoreMax") as number;

  return (
    <section
      id="founder-scoring"
      className="relative z-[2] flex flex-col items-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-24"
    >
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-9 max-w-2xl text-center sm:mb-14">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mb-4 font-heading text-[27px] font-semibold leading-[1.25] text-aff-text sm:mb-5 sm:text-[42px]">
            {t("headline1")}
            <br />
            {t("headline2")}
          </h2>
          <p className="text-[15px] leading-relaxed text-aff-muted sm:text-lg sm:leading-[1.65]">
            {t("body")}
          </p>
        </div>
      </Container>

      <div className="mb-7 text-center font-heading text-[13px] font-semibold tracking-[0.1em] text-aff-muted sm:mb-9 sm:text-sm">
        AFF FOUNDER SCORING
      </div>

      <Container className="!px-0">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 rounded-[20px] border border-aff-line bg-aff-bg2 p-8 sm:flex-row sm:gap-16 sm:p-14">
          <ScoreOverview value={demoScoreValue} max={demoScoreMax} label={t("demoScoreLabel")} />
          <ScoreBreakdown dimensions={dimensions} />
        </div>
      </Container>

      <ScoringExplanation>{t("disclaimer")}</ScoringExplanation>
    </section>
  );
}
