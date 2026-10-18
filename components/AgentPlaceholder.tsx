"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

type AgentPlaceholderProps = {
  agentName: string;
};

export function AgentPlaceholder({ agentName }: AgentPlaceholderProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Alert className="max-w-md">
        <InfoIcon />
        <AlertTitle>{agentName}</AlertTitle>
        <AlertDescription>Not built yet.</AlertDescription>
      </Alert>
    </div>
  );
}
