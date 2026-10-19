import { type StatusTone } from "@/components/agent/ItemStatusDot";
import { ThreadListRow } from "@/components/agent/ThreadListRow";
import { ScrollArea } from "@/components/ui/scroll-area";

export type AgentThreadListEntry = {
  id: string;
  title: string;
  subtitle?: string;
  needsHuman: boolean;
  tone?: StatusTone;
  createdAt: string;
};

type AgentThreadListProps = {
  items: AgentThreadListEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage: string;
  listLabel?: string;
};

export function AgentThreadList({
  items,
  selectedId,
  onSelect,
  emptyMessage,
  listLabel = "Threads",
}: AgentThreadListProps) {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex min-h-0 w-full flex-col gap-2 lg:max-w-xs lg:shrink-0">
      <h2 className="text-sm font-medium text-muted-foreground">{listLabel}</h2>
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ScrollArea className="min-h-[12rem] flex-1 rounded-lg border pr-3">
          <div className="flex flex-col gap-1 p-2">
            {sorted.map((item) => (
              <ThreadListRow
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                tone={item.tone ?? (item.needsHuman ? "human" : "ok")}
                isSelected={item.id === selectedId}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
