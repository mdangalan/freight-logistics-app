"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LlmProvider } from "@/lib/agent/provider";
import { useVisitStore } from "@/lib/visit-store";
import { KeyRoundIcon } from "lucide-react";

const PROVIDERS: { id: LlmProvider; label: string }[] = [
  { id: "gemini", label: "Gemini" },
  { id: "cursor", label: "Cursor" },
  { id: "openai", label: "OpenAI" },
];

function providerKeyCopy(provider: LlmProvider): {
  label: string;
  placeholder: string;
} {
  if (provider === "cursor") {
    return { label: "Cursor API key", placeholder: "cursor_…" };
  }
  if (provider === "openai") {
    return { label: "OpenAI API key", placeholder: "sk-…" };
  }
  return { label: "Gemini API key", placeholder: "AIza…" };
}

export function SettingsPanel() {
  const apiKey = useVisitStore((s) => s.apiKey);
  const setApiKey = useVisitStore((s) => s.setApiKey);
  const llmProvider = useVisitStore((s) => s.llmProvider);
  const setLlmProvider = useVisitStore((s) => s.setLlmProvider);
  const keyCopy = providerKeyCopy(llmProvider);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          API key for Assembler during this visit only. Gemini is the default
          and uses{" "}
          <code className="text-xs">gemini-3.8-flash</code>. Switch to Cursor
          or OpenAI if you want to use a different key.
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Provider</Label>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map(({ id, label }) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={llmProvider === id ? "default" : "outline"}
              onPress={() => setLlmProvider(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="assembler-api-key">{keyCopy.label}</Label>
        <Input
          id="assembler-api-key"
          type="password"
          autoComplete="off"
          placeholder={keyCopy.placeholder}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <Alert>
        <KeyRoundIcon />
        <AlertTitle>Visit only</AlertTitle>
        <AlertDescription>
          The key is kept in memory until you refresh or close this page. It is
          not saved to disk, browser storage, or the items file. Create a Gemini
          key in Google AI Studio. Optional: pin{" "}
          <code className="text-xs">GEMINI_MODEL</code>,{" "}
          <code className="text-xs">CURSOR_MODEL</code>, or{" "}
          <code className="text-xs">OPENAI_MODEL</code> in{" "}
          <code className="text-xs">.env.local</code> and restart{" "}
          <code className="text-xs">npm run dev</code>.
        </AlertDescription>
      </Alert>
    </div>
  );
}
