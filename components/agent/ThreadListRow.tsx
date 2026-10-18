import { ItemStatusDot } from "@/components/agent/ItemStatusDot";
import { cn } from "@/lib/utils";

export type ThreadListRowProps = {
  title: string;
  subtitle?: string;
  needsHuman: boolean;
  isSelected: boolean;
  onSelect: () => void;
};

export function ThreadListRow({
  title,
  subtitle,
  needsHuman,
  isSelected,
  onSelect,
}: ThreadListRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
        isSelected ? "border-primary/40 bg-muted/80" : "border-transparent"
      )}
    >
      <ItemStatusDot needsHuman={needsHuman} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate font-medium">{title}</p>
        {subtitle ? (
          <p
            className={cn(
              "line-clamp-2 text-xs",
              needsHuman
                ? "text-amber-800 dark:text-amber-200"
                : "text-muted-foreground"
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </button>
  );
}
