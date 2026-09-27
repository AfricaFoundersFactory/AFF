import { ButtonLink } from "@/components/ui/Button";

export function SuccessPanel({
  title,
  body,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaLabel: string;
}) {
  return (
    <div className="mx-auto max-w-md py-20 text-center sm:py-32">
      <div
        aria-hidden="true"
        className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-aff-accent text-[26px] text-aff-accent"
      >
        ✓
      </div>
      <h1 className="mb-4 font-heading text-[28px] font-semibold text-aff-text sm:text-[36px]">
        {title}
      </h1>
      <p className="mb-9 text-base leading-relaxed text-aff-muted">{body}</p>
      <ButtonLink href="/">{ctaLabel}</ButtonLink>
    </div>
  );
}
