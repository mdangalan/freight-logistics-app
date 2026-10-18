"use client";

import { useState } from "react";

import { ShipmentForm } from "@/components/ShipmentForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { AssemblerItem } from "@/lib/form/catalog";
import { useVisitStore } from "@/lib/visit-store";
import { AlertCircleIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function ItemStatusDot({ needsHuman }: { needsHuman: boolean }) {
  return (
    <span
      className={cn(
        "mt-1.5 size-2.5 shrink-0 rounded-full",
        needsHuman ? "bg-amber-500" : "bg-emerald-500"
      )}
      aria-hidden
    />
  );
}

function AssemblerItemRow({
  item,
  isSelected,
  onSelect,
}: {
  item: AssemblerItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
        isSelected ? "border-primary/40 bg-muted/80" : "border-transparent"
      )}
    >
      <ItemStatusDot needsHuman={item.needsHuman} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate font-medium">{item.title}</p>
        {item.needsHuman && item.humanReason ? (
          <p className="line-clamp-2 text-xs text-amber-800 dark:text-amber-200">
            {item.humanReason}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function SelectedItemDetail({ item }: { item: AssemblerItem }) {
  const clearHumanFlag = useVisitStore((s) => s.clearHumanFlag);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="gap-3 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Selected item</CardTitle>
            <CardDescription>
              {item.needsHuman ? (
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
          {item.needsHuman ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={() => clearHumanFlag(item.id)}
            >
              I&apos;ve got this
            </Button>
          ) : null}
        </div>
        {item.needsHuman && item.humanReason ? (
          <Alert className="border-amber-500/30 bg-amber-500/5">
            <AlertCircleIcon className="text-amber-600" />
            <AlertTitle className="text-amber-950 dark:text-amber-50">
              Reason
            </AlertTitle>
            <AlertDescription>{item.humanReason}</AlertDescription>
          </Alert>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Customer message
          </h3>
          <p className="whitespace-pre-wrap text-sm">{item.message}</p>
        </section>

        {item.reply ? (
          <>
            <Separator />
            <section className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Assistant reply
              </h3>
              <p className="whitespace-pre-wrap text-sm">{item.reply}</p>
            </section>
          </>
        ) : null}

        <Separator />
        <ShipmentForm form={item.form} formStatus={item.formStatus} />
      </CardContent>
    </Card>
  );
}

export function AssemblerPanel() {
  const [draft, setDraft] = useState("");
  const [missingKeyAlert, setMissingKeyAlert] = useState(false);

  const apiKey = useVisitStore((s) => s.apiKey);
  const items = useVisitStore((s) => s.items);
  const selectedItemId = useVisitStore((s) => s.selectedItemId);
  const setSelectedItemId = useVisitStore((s) => s.setSelectedItemId);

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? null;

  const sortedItems = [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function handleSend() {
    if (!apiKey.trim()) {
      setMissingKeyAlert(true);
      return;
    }
    setMissingKeyAlert(false);
    // Send / OpenAI wiring comes in a later task.
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 border-b bg-background p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight">
            Assembler Agent
          </h1>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            UI preview
          </Badge>
        </div>
        <Textarea
          placeholder="Type the customer's message…"
          className="min-h-24 resize-y"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onPress={handleSend}>
            <SendIcon />
            Send
          </Button>
        </div>
        {missingKeyAlert ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>API key missing</AlertTitle>
            <AlertDescription>
              Add your OpenAI key in Settings before sending. (Send is not wired
              yet — this alert previews the empty-key behavior.)
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row">
        <div className="flex min-h-0 w-full flex-col gap-2 lg:max-w-xs lg:shrink-0">
          <h2 className="text-sm font-medium text-muted-foreground">Items</h2>
          {sortedItems.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No items yet. Type a customer message and send it.
            </p>
          ) : (
            <ScrollArea className="min-h-[12rem] flex-1 rounded-lg border pr-3">
              <div className="flex flex-col gap-1 p-2">
                {sortedItems.map((item) => (
                  <AssemblerItemRow
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedItemId}
                    onSelect={() => setSelectedItemId(item.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {selectedItem ? (
            <SelectedItemDetail item={selectedItem} />
          ) : (
            <div className="flex h-full min-h-[16rem] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Select an item to view the message, reply, and shipment form.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
