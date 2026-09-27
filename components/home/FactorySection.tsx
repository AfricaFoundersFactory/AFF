"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/utils";

export function FactorySection() {
  const t = useTranslations("home.factory");
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const labels = t.raw("labels") as string[];
  const sentences = t.raw("sentences") as string[];
  const total = labels.length;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      const id = requestAnimationFrame(() => setActive(total - 1));
      return () => cancelAnimationFrame(id);
    }

    let ticking = false;

    const update = () => {
      ticking = false;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      let progress = (vh - rect.top) / (rect.height + vh * 0.3);
      progress = Math.max(0, Math.min(1, progress));
      const next = Math.min(total - 1, Math.floor(progress * total));
      setActive((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [total]);

  return (
    <section
      id="the-factory"
      ref={sectionRef}
      className="relative z-[2] px-6 pb-24 sm:px-10 sm:pb-32 lg:px-[120px] lg:pb-[180px]"
      aria-label={t("headline1") + " " + t("headline2")}
    >
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-[90px]">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="font-heading text-[27px] font-semibold leading-[1.25] text-aff-text sm:text-[42px]">
            {t("headline1")}
            <br />
            {t("headline2")}
          </h2>
        </div>
      </Container>

      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex items-start justify-between overflow-x-auto pb-2 sm:overflow-visible">
          {labels.map((label, i) => {
            const lit = i <= active;
            const isCurrent = i === active;
            const hasNext = i < total - 1;
            return (
              <div key={label} className="flex flex-1 items-start" style={{ minWidth: 64 }}>
                <div className="flex min-w-[56px] flex-col items-center gap-2.5 sm:min-w-[70px]">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all duration-500",
                      lit ? "bg-aff-accent" : "bg-aff-line-strong",
                    )}
                    style={
                      isCurrent
                        ? { boxShadow: "0 0 14px rgba(23,201,154,0.8)" }
                        : lit
                          ? { boxShadow: "0 0 8px rgba(23,201,154,0.4)" }
                          : undefined
                    }
                  />
                  <span
                    className={cn(
                      "text-center font-heading text-[11px] font-semibold tracking-[0.04em] transition-colors duration-500 sm:text-[13.5px]",
                      lit ? "text-aff-text" : "text-aff-muted",
                    )}
                  >
                    {label}
                  </span>
                </div>
                {hasNext ? (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "mx-1 mb-6 h-px flex-1 transition-colors duration-700 sm:mx-1",
                      i < active ? "bg-aff-accent" : "bg-aff-line",
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <p
          aria-live="polite"
          className="mt-8 min-h-[28px] text-center text-[15px] font-medium text-aff-text sm:mt-12 sm:text-[16.5px]"
        >
          {sentences[active]}
        </p>
      </div>
    </section>
  );
}
