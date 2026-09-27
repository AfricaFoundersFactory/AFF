import { Button } from "@/components/ui/Button";

export function FormNav({
  showBack,
  onBack,
  backLabel,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
}: {
  showBack: boolean;
  onBack: () => void;
  backLabel: string;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
}) {
  return (
    <div className="mt-11 flex justify-between">
      {showBack ? (
        <Button type="button" variant="secondary" onClick={onBack}>
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onPrimary} disabled={primaryDisabled || primaryLoading}>
        {primaryLoading ? "…" : primaryLabel}
      </Button>
    </div>
  );
}
