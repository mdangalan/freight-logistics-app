"use client";

import { useState } from "react";

import { AgentDetailPlaceholder } from "@/components/agent/AgentDetailPlaceholder";
import { AgentPanelChrome } from "@/components/agent/AgentPanelChrome";
import { AgentThreadList } from "@/components/agent/AgentThreadList";
import { AgentMessageComposer } from "@/components/agent/AgentMessageComposer";
import { ConversationTimeline } from "@/components/agent/ConversationTimeline";
import { HumanReviewHeader } from "@/components/agent/HumanReviewHeader";
import { ShipmentForm } from "@/components/ShipmentForm";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AssemblerItem, ClarificationMessage } from "@/lib/form/catalog";
import { useVisitStore } from "@/lib/visit-store";

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
  const clearHumanFlag = useVisitStore((s) => s.clearHumanFlag);

  return (
    <Card className="border-border/80 shadow-sm">
      <HumanReviewHeader
        cardTitle="Selected item"
        needsHuman={item.needsHuman}
        humanReason={item.humanReason}
        onClearHumanFlag={
          item.needsHuman ? () => clearHumanFlag(item.id) : undefined
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

  const apiKey = useVisitStore((s) => s.apiKey);
  const items = useVisitStore((s) => s.items);
  const selectedItemId = useVisitStore((s) => s.selectedItemId);
  const setSelectedItemId = useVisitStore((s) => s.setSelectedItemId);

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? null;

  function handleSend() {
    if (!apiKey.trim()) {
      setMissingKeyAlert(true);
      return;
    }
    setMissingKeyAlert(false);
    // Send / OpenAI wiring comes in a later task.
  }

  const topBar = (
    <AgentMessageComposer
      value={draft}
      onChange={setDraft}
      onSend={handleSend}
      showMissingKeyAlert={missingKeyAlert}
      missingKeyContext="(Send is not wired yet — this alert previews the empty-key behavior.)"
    />
  );

  return (
    <AgentPanelChrome title="Assembler Agent" topBar={topBar}>
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
