import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

type AgentSendAlertsProps = {
  error: string;
  notice: string;
};

export function AgentSendAlerts({ error, notice }: AgentSendAlertsProps) {
  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Send failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertCircleIcon className="text-amber-600" />
          <AlertTitle className="text-amber-950 dark:text-amber-50">
            No assistant reply
          </AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
