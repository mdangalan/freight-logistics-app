"use client";

import { useEffect, useState } from "react";

import { AgentDetailPlaceholder } from "@/components/agent/AgentDetailPlaceholder";
import { AgentPanelChrome } from "@/components/agent/AgentPanelChrome";
import { AgentThreadList } from "@/components/agent/AgentThreadList";
import { AgentMessageComposer } from "@/components/agent/AgentMessageComposer";
import { ConversationTimeline } from "@/components/agent/ConversationTimeline";
import { HumanReviewHeader } from "@/components/agent/HumanReviewHeader";
import { ShipmentForm } from "@/components/ShipmentForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AssemblerItem, ClarificationMessage } from "@/lib/form/catalog";
import { useVisitStore } from "@/lib/visit-store";
import { AlertCircleIcon } from "lucide-react";

function assemblerConversationMessages(
  item: AssemblerItem
): ClarificationMessage[] {
  const messages: ClarificationMessage[] = [
    {
      id: `${item.id}-customer`,
      role: "customer",
      content: item.message,
      sentAt: item.createdAt,
    },
  ];
  if (item.reply) {
    messages.push({
      id: `${item.id}-assistant`,
      role: "assistant",
      content: item.reply,
      sentAt: item.createdAt,
    });
  }
  return messages;
}

function AssemblerItemDetail({ item }: { item: AssemblerItem }) {
  const upsertItem = useVisitStore((s) => s.upsertItem);
  const [clearing, setClearing] = useState(false);

  async function handleClearHumanFlag() {
    if (clearing) return;
    setClearing(true);
    try {
      const response = await fetch(`/api/assembler/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearHumanFlag" }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { item?: AssemblerItem };
      if (payload.item) upsertItem(payload.item);
    } finally {
      setClearing(false);
    }
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <HumanReviewHeader
        cardTitle="Selected item"
        needsHuman={item.needsHuman}
        humanReason={item.humanReason}
        onClearHumanFlag={
          item.needsHuman ? handleClearHumanFlag : undefined
        }
      />
      <CardContent className="space-y-6">
        <ConversationTimeline
          messages={assemblerConversationMessages(item)}
          agentLabel="Assembler agent"
        />

        <Separator />
        <ShipmentForm form={item.form} formStatus={item.formStatus} />
      </CardContent>
    </Card>
  );
}

export function AssemblerPanel() {
  const [draft, setDraft] = useState("");
  const [missingKeyAlert, setMissingKeyAlert] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendNotice, setSendNotice] = useState("");

  const apiKey = useVisitStore((s) => s.apiKey);
  const llmProvider = useVisitStore((s) => s.llmProvider);
  const items = useVisitStore((s) => s.items);
  const selectedItemId = useVisitStore((s) => s.selectedItemId);
  const setSelectedItemId = useVisitStore((s) => s.setSelectedItemId);
  const setItems = useVisitStore((s) => s.setItems);
  const upsertItem = useVisitStore((s) => s.upsertItem);

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadItems() {
      try {
        const response = await fetch("/api/assembler", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: AssemblerItem[] };
        if (cancelled || !Array.isArray(payload.items)) return;
        setItems(payload.items);
        const current = useVisitStore.getState().selectedItemId;
        if (current && payload.items.some((item) => item.id === current)) {
          return;
        }
        setSelectedItemId(payload.items[0]?.id ?? null);
      } catch {
        // File list is empty until a send succeeds.
      }
    }
    void loadItems();
    return () => {
      cancelled = true;
    };
  }, [setItems, setSelectedItemId]);

  async function handleSend() {
    if (!apiKey.trim()) {
      setMissingKeyAlert(true);
      setSendError("");
      return;
    }
    const message = draft.trim();
    if (!message || isSending) return;

    setMissingKeyAlert(false);
    setSendError("");
    setSendNotice("");
    setIsSending(true);
    try {
      const response = await fetch("/api/assembler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, message, provider: llmProvider }),
      });
      const payload = (await response.json().catch(() => null)) as {
        item?: AssemblerItem;
        error?: string;
      } | null;

      if (response.status === 400 && payload?.error === "missing_api_key") {
        setMissingKeyAlert(true);
        return;
      }
      if (!response.ok || !payload?.item) {
        setSendError("The assistant could not answer. Try again.");
        return;
      }

      upsertItem(payload.item);
      setSelectedItemId(payload.item.id);
      setDraft("");
      if (payload.item.needsHuman && !payload.item.reply) {
        setSendNotice(
          payload.item.humanReason ||
            "The assistant could not answer. Check Settings and the dev-server terminal."
        );
      }
    } catch {
      setSendError("The assistant could not answer. Try again.");
    } finally {
      setIsSending(false);
    }
  }

  const topBar = (
    <>
      <AgentMessageComposer
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        showMissingKeyAlert={missingKeyAlert}
        isSending={isSending}
      />
      {sendError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Send failed</AlertTitle>
          <AlertDescription>{sendError}</AlertDescription>
        </Alert>
      ) : null}
      {sendNotice ? (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertCircleIcon className="text-amber-600" />
          <AlertTitle className="text-amber-950 dark:text-amber-50">
            No assistant reply
          </AlertTitle>
          <AlertDescription>{sendNotice}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );

  return (
    <AgentPanelChrome title="Assembler Agent" preview={false} topBar={topBar}>
      <AgentThreadList
        listLabel="Items"
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle:
            item.needsHuman && item.humanReason
              ? item.humanReason
              : undefined,
          needsHuman: item.needsHuman,
          createdAt: item.createdAt,
        }))}
        selectedId={selectedItemId}
        onSelect={setSelectedItemId}
        emptyMessage="No items yet. Type a customer message and send it."
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selectedItem ? (
          <AssemblerItemDetail item={selectedItem} />
        ) : (
          <AgentDetailPlaceholder message="Select an item to view the message, reply, and shipment form." />
        )}
      </div>
    </AgentPanelChrome>
  );
}
