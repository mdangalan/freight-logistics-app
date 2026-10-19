"use client";

import { MissingApiKeyAlert } from "@/components/agent/MissingApiKeyAlert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

type CustomerReplyComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  showMissingKeyAlert: boolean;
  missingKeyContext?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  isSending?: boolean;
};

export function CustomerReplyComposer({
  value,
  onChange,
  onSend,
  showMissingKeyAlert,
  missingKeyContext,
  label = "Simulated customer reply",
  placeholder = "Type the customer's email reply…",
  hint = "The agent reads this reply, updates the form, and asks only what is still open.",
  isSending = false,
}: CustomerReplyComposerProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="customer-reply">{label}</Label>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <Textarea
        id="customer-reply"
        placeholder={placeholder}
        className="min-h-20 resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isSending}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onPress={onSend}
          isPending={isSending}
          isDisabled={isSending || !value.trim()}
        >
          <SendIcon />
          Send
        </Button>
      </div>
      {showMissingKeyAlert ? (
        <MissingApiKeyAlert context={missingKeyContext} />
      ) : null}
    </div>
  );
}
