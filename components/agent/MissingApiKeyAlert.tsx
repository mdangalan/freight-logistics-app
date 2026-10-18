import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

type MissingApiKeyAlertProps = {
  context?: string;
};

export function MissingApiKeyAlert({ context }: MissingApiKeyAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>API key missing</AlertTitle>
      <AlertDescription>
        Add your API key in Settings before sending.
        {context ? ` ${context}` : null}
      </AlertDescription>
    </Alert>
  );
}
