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
};

export function CustomerReplyComposer({
  value,
  onChange,
  onSend,
  showMissingKeyAlert,
  missingKeyContext,
  label = "Simulated customer reply",
  placeholder = "Type the customer's email reply…",
  hint = "Send is not wired yet — this previews the per-thread reply flow.",
}: CustomerReplyComposerProps) {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-4">
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
    </div>
  );
}
