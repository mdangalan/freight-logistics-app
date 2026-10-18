"use client";

import { MissingApiKeyAlert } from "@/components/agent/MissingApiKeyAlert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

type AgentMessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  showMissingKeyAlert: boolean;
  missingKeyContext?: string;
  placeholder?: string;
  hint?: string;
};

export function AgentMessageComposer({
  value,
  onChange,
  onSend,
  showMissingKeyAlert,
  missingKeyContext,
  placeholder = "Type the customer's message…",
  hint,
}: AgentMessageComposerProps) {
  return (
    <>
      {hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
      <Textarea
        placeholder={placeholder}
        className="min-h-24 resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onPress={onSend}>
          <SendIcon />
          Send
        </Button>
      </div>
      {showMissingKeyAlert ? (
        <MissingApiKeyAlert context={missingKeyContext} />
      ) : null}
    </>
  );
}
