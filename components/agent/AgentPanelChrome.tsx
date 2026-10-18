import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

type AgentPanelChromeProps = {
  title: string;
  preview?: boolean;
  headerExtra?: ReactNode;
  topBar?: ReactNode;
  children: ReactNode;
};

export function AgentPanelChrome({
  title,
  preview = true,
  headerExtra,
  topBar,
  children,
}: AgentPanelChromeProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {topBar ? (
        <div className="sticky top-0 z-10 shrink-0 space-y-3 border-b bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <div className="flex items-center gap-2">
              {headerExtra}
              {preview ? (
                <Badge
                  variant="outline"
                  className="font-normal text-muted-foreground"
                >
                  UI preview
                </Badge>
              ) : null}
            </div>
          </div>
          {topBar}
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <div className="flex items-center gap-2">
            {headerExtra}
            {preview ? (
              <Badge
                variant="outline"
                className="font-normal text-muted-foreground"
              >
                UI preview
              </Badge>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        {children}
      </div>
    </div>
  );
}
