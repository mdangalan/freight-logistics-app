import { BotIcon } from "lucide-react";

type AssistantTypingIndicatorProps = {
  agentLabel?: string;
};

const DOT_DELAYS = ["0ms", "160ms", "320ms"] as const;

export function AssistantTypingIndicator({
  agentLabel = "Assembler agent",
}: AssistantTypingIndicatorProps) {
  return (
    <div
      className="mr-8 flex gap-2.5 rounded-lg border border-border/50 bg-muted px-3 py-2.5 text-foreground"
      role="status"
      aria-live="polite"
      aria-label={`${agentLabel} is writing a reply`}
    >
      <BotIcon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        <span className="text-xs font-medium">{agentLabel}</span>
        <div className="flex h-5 items-end gap-1 pb-0.5" aria-hidden>
          {DOT_DELAYS.map((delay) => (
            <span
              key={delay}
              className="size-2 rounded-full bg-muted-foreground animate-typing-dot motion-reduce:animate-none motion-reduce:opacity-60"
              style={{ animationDelay: delay }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
