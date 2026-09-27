import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

export async function HeroJourneySection() {
  const t = await getTranslations("home.heroJourney");
  const labels = t.raw("labels") as string[];
  const litCount = t.raw("lit") as number;

  const steps = labels.map((label, i) => ({
    label,
    isLit: i < litCount,
    hasNext: i < labels.length - 1,
    lineLit: i < litCount - 1,
  }));

  return (
    <section className="relative z-[2] px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0 flex justify-center">
        {/* Mobile: vertical journey */}
        <div className="w-full rounded-2xl border border-aff-line bg-aff-bg2 p-7 sm:hidden">
          <ol className="flex flex-col">
            {steps.map((step) => (
              <li key={step.label} className="flex items-start gap-3.5">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                      step.isLit ? "bg-aff-accent" : "bg-aff-line-strong",
                    )}
                    style={step.isLit ? { boxShadow: "0 0 10px rgba(23,201,154,0.7)" } : undefined}
                  />
                  {step.hasNext ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-px flex-1 min-h-[22px]",
                        step.lineLit ? "bg-aff-accent" : "bg-aff-line",
                      )}
                    />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "pb-5 font-heading text-sm font-semibold",
                    step.isLit ? "text-aff-text" : "text-aff-muted",
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Desktop: horizontal journey */}
        <div className="relative hidden w-full max-w-[1200px] overflow-hidden rounded-[20px] border border-aff-line bg-aff-bg2 p-14 sm:block">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 0%, rgba(23,201,154,0.10), transparent 55%)",
            }}
          />
          <div className="relative flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.label} className="flex flex-1 items-center">
                <div className="flex min-w-[80px] flex-col items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-3 w-3 rounded-full",
                      step.isLit ? "bg-aff-accent" : "bg-aff-line-strong",
                    )}
                    style={step.isLit ? { boxShadow: "0 0 12px rgba(23,201,154,0.7)" } : undefined}
                  />
                  <span
                    className={cn(
                      "font-heading text-sm font-semibold tracking-[0.05em]",
                      step.isLit ? "text-aff-text" : "text-aff-muted",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {step.hasNext ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mx-1.5 mb-[26px] h-px flex-1",
                      step.lineLit ? "bg-aff-accent" : "bg-aff-line",
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
