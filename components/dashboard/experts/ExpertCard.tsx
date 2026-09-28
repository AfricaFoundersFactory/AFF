import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ExpertProfile } from "@/types/experts";

const AVAILABILITY_DOT: Record<ExpertProfile["availability"], string> = {
  AVAILABLE: "bg-emerald-400",
  LIMITED: "bg-amber-400",
  UNAVAILABLE: "bg-aff-muted",
};

/**
 * Presentational expert card — name, headline, country, languages, top
 * expertise, relevant stages, availability. Deliberately NEVER renders a
 * rating, session count, testimonial, or "top expert" badge — none of that
 * data exists (see AFF-DASH-07 spec: no fabricated social proof).
 */
export function ExpertCard({ expert }: { expert: ExpertProfile }) {
  const t = useTranslations("dashboard.experts");
  const tStage = useTranslations("dashboard.stage");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-aff-line bg-aff-bg p-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-[15px] font-semibold text-aff-text">{expert.displayName}</h3>
          {expert.verificationStatus === "AFF_VERIFIED" ? (
            <span className="rounded-full bg-aff-cyan/15 px-2 py-0.5 text-[10.5px] font-semibold text-aff-cyan">
              {t("verification.AFF_VERIFIED")}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[13px] text-aff-muted">{expert.headline}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-aff-muted">
        <span>{expert.country}</span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${AVAILABILITY_DOT[expert.availability]}`} aria-hidden="true" />
          {t(`availability.${expert.availability}`)}
        </span>
        <span>{expert.languages.map((l) => t(`languages.${l}`)).join(", ")}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {expert.expertise.slice(0, 3).map((e) => (
          <span key={e} className="rounded-full border border-aff-line px-2 py-0.5 text-[11px] text-aff-text">
            {t(`expertise.${e}`)}
          </span>
        ))}
      </div>

      {expert.startupStages.length > 0 ? (
        <p className="text-[11.5px] text-aff-muted">{expert.startupStages.map((s) => tStage(s)).join(" · ")}</p>
      ) : null}

      <Link
        href={`/dashboard/experts/${expert.id}`}
        className="mt-1 text-[13px] font-semibold text-aff-accent hover:text-aff-accent-hover"
      >
        {t("directory.viewProfile")}
      </Link>
    </div>
  );
}
