import { ConversationTimeline } from "@/components/agent/ConversationTimeline";
import { Card, CardContent } from "@/components/ui/card";

type PendingSendTimelineProps = {
  content: string;
  sentAt: string;
  agentLabel: string;
};

export function PendingSendTimeline({
  content,
  sentAt,
  agentLabel,
}: PendingSendTimelineProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent>
        <ConversationTimeline
          messages={[
            {
              id: "pending-customer",
              role: "customer",
              content,
              sentAt,
            },
          ]}
          agentLabel={agentLabel}
          awaitingReply
        />
      </CardContent>
    </Card>
  );
}
