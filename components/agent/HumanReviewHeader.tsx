import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircleIcon } from "lucide-react";

type HumanReviewHeaderProps = {
  cardTitle: string;
  needsHuman: boolean;
  humanReason?: string;
  onClearHumanFlag?: () => void;
};

export function HumanReviewHeader({
  cardTitle,
  needsHuman,
  humanReason,
  onClearHumanFlag,
}: HumanReviewHeaderProps) {
  return (
    <CardHeader className="gap-3 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{cardTitle}</CardTitle>
          <CardDescription>
            {needsHuman ? (
              <Badge
                variant="secondary"
                className="bg-amber-500/15 text-amber-900 dark:text-amber-100"
              >
                Needs a person
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
              >
                No person needed
              </Badge>
            )}
          </CardDescription>
        </div>
        {needsHuman && onClearHumanFlag ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onPress={onClearHumanFlag}
          >
            I&apos;ve got this
          </Button>
        ) : null}
      </div>
      {needsHuman && humanReason ? (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertCircleIcon className="text-amber-600" />
          <AlertTitle className="text-amber-950 dark:text-amber-50">
            Reason
          </AlertTitle>
          <AlertDescription>{humanReason}</AlertDescription>
        </Alert>
      ) : null}
    </CardHeader>
  );
}
