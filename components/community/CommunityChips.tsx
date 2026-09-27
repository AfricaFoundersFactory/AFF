import { Chip } from "@/components/ui/Chip";

type ChipItem = { label: string; future?: boolean };

export function CommunityChips({ chips }: { chips: ChipItem[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3.5">
      {chips.map((chip) => (
        <Chip key={chip.label} label={chip.label} future={chip.future} />
      ))}
    </div>
  );
}
