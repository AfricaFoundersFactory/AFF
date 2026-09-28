import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { HeroSection } from "@/components/home/HeroSection";
import { HeroJourneySection } from "@/components/home/HeroJourneySection";
import { ProblemSection } from "@/components/home/ProblemSection";
import { FactorySection } from "@/components/home/FactorySection";
import { ScoringSection } from "@/components/home/ScoringSection";
import { ScoreCycleSection } from "@/components/home/ScoreCycleSection";
import { ScoreToActionSection } from "@/components/home/ScoreToActionSection";
import { ProgressTrackingSection } from "@/components/home/ProgressTrackingSection";
import { FounderProfileSection } from "@/components/home/FounderProfileSection";
import { PitchLabSection } from "@/components/home/PitchLabSection";
import { PitchLiveTeaserSection } from "@/components/home/PitchLiveTeaserSection";
import { StartupReadinessSection } from "@/components/home/StartupReadinessSection";
import { PersonalizedRoadmapSection } from "@/components/home/PersonalizedRoadmapSection";
import { ExpertFeedbackSection } from "@/components/home/ExpertFeedbackSection";
import { CommunitySection } from "@/components/home/CommunitySection";
import { ResourcesTeaserSection } from "@/components/home/ResourcesTeaserSection";
import { DiasporaSection } from "@/components/home/DiasporaSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  return { title: t("title"), description: t("description") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <HeroSection />
      <HeroJourneySection />
      <ProblemSection />
      <FactorySection />
      <ScoringSection />
      <ScoreCycleSection />
      <ScoreToActionSection />
      <ProgressTrackingSection />
      <FounderProfileSection />
      <PitchLabSection />
      <PitchLiveTeaserSection />
      <StartupReadinessSection />
      <PersonalizedRoadmapSection />
      <ExpertFeedbackSection />
      <CommunitySection />
      <ResourcesTeaserSection />
      <DiasporaSection />
      <FinalCtaSection />
    </>
  );
}
