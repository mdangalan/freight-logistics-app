import { ConversationMessageBubble } from "@/components/agent/ConversationMessageBubble";
import type { ClarificationMessage } from "@/lib/form/catalog";
import { cn } from "@/lib/utils";

type ConversationTimelineProps = {
  messages: ClarificationMessage[];
  className?: string;
  agentLabel?: string;
  heading?: string;
};

export function ConversationTimeline({
  messages,
  className,
  agentLabel = "Clarification agent",
  heading = "Conversation",
}: ConversationTimelineProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {heading}
      </h3>
      <div className="space-y-3">
        {messages.map((message) => (
          <ConversationMessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            sentAt={message.sentAt}
            agentLabel={agentLabel}
          />
        ))}
      </div>
    </section>
  );
}
