"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVisitStore } from "@/lib/visit-store";
import { KeyRoundIcon } from "lucide-react";

export function SettingsPanel() {
  const apiKey = useVisitStore((s) => s.apiKey);
  const setApiKey = useVisitStore((s) => s.setApiKey);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          OpenAI API key for Assembler during this visit only.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="openai-api-key">OpenAI API key</Label>
        <Input
          id="openai-api-key"
          type="password"
          autoComplete="off"
          placeholder="sk-…"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <Alert>
        <KeyRoundIcon />
        <AlertTitle>Visit only</AlertTitle>
        <AlertDescription>
          The key is kept in memory until you refresh or close this page. It is
          not saved to disk, browser storage, or the items file.
        </AlertDescription>
      </Alert>
    </div>
  );
}
