"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { Button } from "@/components/ui/Button";
import type { AssessmentAnswerValue, QuestionDefinition } from "@/types/readiness-engine";

export function QuestionField({
  question,
  value,
  onChange,
}: {
  question: QuestionDefinition;
  value: AssessmentAnswerValue | undefined;
  onChange: (value: AssessmentAnswerValue) => void;
}) {
  const t = useTranslations("dashboard.readiness");
  const tq = useTranslations("dashboard.readiness.questions");
  const label = tq(question.labelKey);

  if (question.type === "yes_no") {
    return (
      <div>
        <div className="mb-2 text-[14px] text-aff-text">{label}</div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={value === true ? "primary" : "secondary"}
            onClick={() => onChange(true)}
            className="px-5 py-2.5 text-[13.5px]"
          >
            {t("yes")}
          </Button>
          <Button
            type="button"
            variant={value === false ? "primary" : "secondary"}
            onClick={() => onChange(false)}
            className="px-5 py-2.5 text-[13.5px]"
          >
            {t("no")}
          </Button>
        </div>
      </div>
    );
  }

  if (question.type === "scale") {
    const current = typeof value === "number" ? value : undefined;
    return (
      <div>
        <div className="mb-2 text-[14px] text-aff-text">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-aff-muted">{t("scaleLow")}</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={current === n}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors",
                current === n
                  ? "border-aff-accent bg-aff-accent-soft text-aff-text"
                  : "border-aff-line text-aff-muted hover:border-aff-line-strong",
              )}
            >
              {n}
            </button>
          ))}
          <span className="text-[11.5px] text-aff-muted">{t("scaleHigh")}</span>
        </div>
      </div>
    );
  }

  if (question.type === "single_select") {
    return (
      <SelectField
        id={question.id}
        label={label}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {" "}
        </option>
        {question.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {tq(opt.labelKey)}
          </option>
        ))}
      </SelectField>
    );
  }

  if (question.type === "multi_select" && question.options) {
    const current = Array.isArray(value) ? value : [];
    return (
      <div>
        <div className="mb-2 text-[14px] text-aff-text">{label}</div>
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt) => {
            const selected = current.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange(selected ? current.filter((v) => v !== opt.value) : [...current, opt.value])
                }
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
                  selected ? "border-aff-accent bg-aff-accent-soft text-aff-text" : "border-aff-line text-aff-muted",
                )}
              >
                {tq(opt.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // number / percentage / text fallback
  return (
    <TextField
      id={question.id}
      label={label}
      type={question.type === "number" || question.type === "percentage" ? "number" : "text"}
      value={typeof value === "string" || typeof value === "number" ? value : ""}
      onChange={(e) => onChange(question.type === "text" ? e.target.value : Number(e.target.value))}
    />
  );
}
