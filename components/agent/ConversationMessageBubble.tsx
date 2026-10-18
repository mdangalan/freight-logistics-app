import { BotIcon, UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ConversationMessageRole = "assistant" | "customer";

type ConversationMessageBubbleProps = {
  role: ConversationMessageRole;
  content: string;
  sentAt?: string;
  agentLabel?: string;
};

function formatSentAt(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ConversationMessageBubble({
  role,
  content,
  sentAt,
  agentLabel = "Agent",
}: ConversationMessageBubbleProps) {
  const isAgent = role === "assistant";
  const Icon = isAgent ? BotIcon : UserIcon;
  const label = isAgent ? agentLabel : "Customer";

  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg px-3 py-2.5",
        isAgent
          ? "mr-8 border border-border/50 bg-muted text-foreground"
          : "ml-8 bg-blue-600 text-white shadow-sm"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          isAgent ? "text-muted-foreground" : "text-white"
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={cn(
              "text-xs font-medium",
              isAgent ? "text-foreground" : "text-white"
            )}
          >
            {label}
          </span>
          {sentAt ? (
            <time
              className={cn(
                "text-xs",
                isAgent ? "text-muted-foreground" : "text-white/80"
              )}
              dateTime={sentAt}
            >
              {formatSentAt(sentAt)}
            </time>
          ) : null}
        </div>
        <p
          className={cn(
            "whitespace-pre-wrap text-sm leading-relaxed",
            isAgent ? "text-foreground" : "text-white"
          )}
        >
          {content}
        </p>
      </div>
    </div>
  );
}
