import { cn } from "@/lib/utils";

type ItemStatusDotProps = {
  needsHuman: boolean;
};

export function ItemStatusDot({ needsHuman }: ItemStatusDotProps) {
  return (
    <span
      className={cn(
        "mt-1.5 size-2.5 shrink-0 rounded-full",
        needsHuman ? "bg-amber-500" : "bg-emerald-500"
      )}
      aria-hidden
    />
  );
}
