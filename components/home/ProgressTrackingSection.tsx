import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ProgressChart } from "@/components/scoring/ProgressChart";
import { AssessmentHistory } from "@/components/scoring/AssessmentHistory";
import type { AssessmentPoint, CategoryEvolution } from "@/types/scoring";

export async function ProgressTrackingSection() {
  const t = await getTranslations("home.progress");
  const tc = await getTranslations("common");
  const assessments = t.raw("assessments") as AssessmentPoint[];
  const categories = t.raw("categories") as CategoryEvolution[];

  return (
    <section className="relative z-[2] flex flex-col items-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-10 max-w-xl text-center sm:mb-16">
          <h2 className="font-heading text-2xl font-semibold leading-[1.25] text-aff-text sm:text-[38px]">
            {t("headline1")}
            <br />
            {t("headline2")}
          </h2>
        </div>
      </Container>
      <Container className="!px-0">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 sm:flex-row sm:gap-[72px]">
          <ProgressChart points={assessments} />
          <AssessmentHistory categories={categories} />
        </div>
      </Container>
      <div className="mt-6 text-center text-xs text-aff-muted sm:mt-7">
        {tc("illustrativeData")}
      </div>
    </section>
  );
}
