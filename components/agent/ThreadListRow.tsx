import { ItemStatusDot, type StatusTone } from "@/components/agent/ItemStatusDot";
import { cn } from "@/lib/utils";

const TONE_SUBTITLE: Record<StatusTone, string> = {
  ok: "text-muted-foreground",
  waiting: "text-orange-800 dark:text-orange-200",
  human: "text-red-800 dark:text-red-200",
};

export type ThreadListRowProps = {
  title: string;
  subtitle?: string;
  tone?: StatusTone;
  isSelected: boolean;
  onSelect: () => void;
};

export function ThreadListRow({
  title,
  subtitle,
  tone = "ok",
  isSelected,
  onSelect,
}: ThreadListRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors [content-visibility:auto] [contain-intrinsic-size:auto_3.5rem] hover:bg-muted/60",
        isSelected ? "border-primary/40 bg-muted/80" : "border-transparent"
      )}
    >
      <ItemStatusDot tone={tone} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate font-medium">{title}</p>
        {subtitle ? (
          <p className={cn("line-clamp-2 text-xs", TONE_SUBTITLE[tone])}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </button>
  );
}
