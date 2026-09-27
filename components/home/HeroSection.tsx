import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const desktopLines = [
  { x1: 140, y1: 120, x2: 360, y2: 60, len: 260, delay: "0.2s" },
  { x1: 360, y1: 60, x2: 620, y2: 140, len: 300, delay: "0.6s" },
  { x1: 620, y1: 140, x2: 880, y2: 70, len: 280, delay: "1s" },
  { x1: 880, y1: 70, x2: 1080, y2: 180, len: 240, delay: "1.4s" },
  { x1: 140, y1: 120, x2: 260, y2: 320, len: 220, delay: "0.9s" },
  { x1: 1080, y1: 180, x2: 1000, y2: 380, len: 230, delay: "1.7s" },
];

const desktopDots = [
  { cx: 140, cy: 120, r: 3.5, delay: "0s", dur: "4s" },
  { cx: 360, cy: 60, r: 3, delay: "0.4s", dur: "5s" },
  { cx: 620, cy: 140, r: 4, delay: "0.8s", dur: "4.5s" },
  { cx: 880, cy: 70, r: 3, delay: "1.1s", dur: "5.2s" },
  { cx: 1080, cy: 180, r: 3.5, delay: "1.5s", dur: "4.2s" },
  { cx: 260, cy: 320, r: 3, delay: "0.6s", dur: "4.8s" },
  { cx: 1000, cy: 380, r: 3, delay: "1.2s", dur: "4.6s" },
];

const mobileLines = [
  { x1: 30, y1: 40, x2: 140, y2: 20 },
  { x1: 140, y1: 20, x2: 260, y2: 55 },
  { x1: 260, y1: 55, x2: 320, y2: 130 },
  { x1: 30, y1: 40, x2: 70, y2: 140 },
];

const mobileDots = [
  { cx: 30, cy: 40, r: 3, delay: "0s", dur: "4s" },
  { cx: 140, cy: 20, r: 2.5, delay: "0.3s", dur: "4.6s" },
  { cx: 260, cy: 55, r: 3, delay: "0.6s", dur: "5s" },
  { cx: 320, cy: 130, r: 2.5, delay: "0.9s", dur: "4.3s" },
  { cx: 70, cy: 140, r: 2.5, delay: "0.5s", dur: "4.8s" },
];

export async function HeroSection() {
  const t = await getTranslations("home.hero");
  const tc = await getTranslations("common");

  return (
    <section className="relative flex flex-col items-center overflow-hidden px-6 pt-9 sm:px-10 sm:pt-16 lg:px-[120px] lg:pt-[70px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-140px] h-[420px] w-[480px] -translate-x-1/2 rounded-full blur-md sm:top-[-220px] sm:h-[700px] sm:w-[1100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(23,201,154,0.20) 0%, rgba(34,184,214,0.08) 45%, rgba(0,26,45,0) 72%)",
        }}
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 350 180"
        className="pointer-events-none absolute left-5 top-4 w-[300px] sm:hidden"
      >
        <g stroke="var(--aff-accent)" strokeOpacity="0.25" fill="none" strokeWidth="1">
          {mobileLines.map((l) => (
            <line key={`${l.x1}-${l.y1}-${l.x2}-${l.y2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        <g fill="var(--aff-accent)">
          {mobileDots.map((d) => (
            <circle
              key={`${d.cx}-${d.cy}`}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              className="motion-safe:animate-aff-pulse"
              style={{ animationDelay: d.delay, animationDuration: d.dur }}
            />
          ))}
        </g>
      </svg>

      <svg
        aria-hidden="true"
        viewBox="0 0 1200 480"
        className="pointer-events-none absolute left-[120px] top-[60px] hidden w-[1200px] sm:block"
      >
        <g stroke="var(--aff-accent)" strokeOpacity="0.28" fill="none" strokeWidth="1">
          {desktopLines.map((l) => (
            <line
              key={`${l.x1}-${l.y1}-${l.x2}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              strokeDasharray={l.len}
              strokeDashoffset={l.len}
              className="motion-safe:animate-aff-dash"
              style={{ animationDelay: l.delay }}
            />
          ))}
        </g>
        <g fill="var(--aff-accent)">
          {desktopDots.map((d) => (
            <circle
              key={`${d.cx}-${d.cy}`}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              className="motion-safe:animate-aff-pulse"
              style={{ animationDelay: d.delay, animationDuration: d.dur }}
            />
          ))}
        </g>
      </svg>

      <div className="relative z-[2] flex flex-col items-center pt-7 text-center sm:pt-14">
        <div className="mb-4 text-[11.5px] font-semibold tracking-[0.1em] text-aff-accent sm:mb-6 sm:text-[13px]">
          {t("eyebrow")}
        </div>
        <h1 className="mb-4 max-w-[920px] font-heading text-[32px] font-semibold leading-[1.2] tracking-[-0.01em] text-aff-text sm:mb-6 sm:text-[64px] sm:leading-[1.14]">
          {t("headlinePre")}
          <br />
          {t("headlineMid")} <span className="text-aff-accent">{t("headlineAccent")}</span>
          {t("headlineEnd")}
        </h1>
        <p className="mb-7 max-w-[680px] text-[15.5px] leading-relaxed text-aff-muted sm:mb-10 sm:text-[19px] sm:leading-[1.65]">
          {t("body")}
        </p>
        <div
          className={cn(
            "mb-7 flex w-full max-w-sm flex-col gap-3 sm:mb-10 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4",
          )}
        >
          <ButtonLink href="/join" block className="sm:w-auto">
            {tc("joinCta")}
          </ButtonLink>
          <ButtonLink href="/pitch-live" variant="secondary" block className="sm:w-auto">
            {tc("pitchCta")}
          </ButtonLink>
        </div>
        <div className="text-[10.5px] font-semibold tracking-[0.16em] text-aff-muted sm:text-[12.5px]">
          {t("tagline")}
        </div>
      </div>
    </section>
  );
}
