"use client";

import { useState } from "react";

import { AgentDetailPlaceholder } from "@/components/agent/AgentDetailPlaceholder";
import { AgentMessageComposer } from "@/components/agent/AgentMessageComposer";
import { AgentPanelChrome } from "@/components/agent/AgentPanelChrome";
import { AgentThreadList } from "@/components/agent/AgentThreadList";
import { ConversationTimeline } from "@/components/agent/ConversationTimeline";
import { CustomerReplyComposer } from "@/components/agent/CustomerReplyComposer";
import { HumanReviewHeader } from "@/components/agent/HumanReviewHeader";
import { ShipmentForm } from "@/components/ShipmentForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ClarificationThread, InquiryStatus } from "@/lib/form/catalog";
import { useVisitStore } from "@/lib/visit-store";

function inquiryStatusLabel(status: InquiryStatus) {
  return status === "awaiting_customer" ? "Awaiting customer" : "Clarifying";
}

function ClarificationThreadWindow({ thread }: { thread: ClarificationThread }) {
  const clearHumanFlag = useVisitStore((s) => s.clearClarificationHumanFlag);
  const apiKey = useVisitStore((s) => s.apiKey);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyMissingKeyAlert, setReplyMissingKeyAlert] = useState(false);

  function handleThreadReplySend() {
    if (!apiKey.trim()) {
      setReplyMissingKeyAlert(true);
      return;
    }
    setReplyMissingKeyAlert(false);
    // Customer reply + agent response wiring comes in a later task.
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b bg-background p-4">
        <CustomerReplyComposer
          value={replyDraft}
          onChange={setReplyDraft}
          onSend={handleThreadReplySend}
          showMissingKeyAlert={replyMissingKeyAlert}
          missingKeyContext="(Send is not wired yet — after send, the clarification agent would read this reply and update the thread.)"
          hint="Reply as the customer in this thread. When you send, the clarification agent will respond automatically once wired."
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        <Card className="border-border/80 shadow-sm">
          <HumanReviewHeader
            cardTitle="Selected thread"
            needsHuman={thread.needsHuman}
            humanReason={thread.humanReason}
            onClearHumanFlag={
              thread.needsHuman
                ? () => clearHumanFlag(thread.id)
                : undefined
            }
          />
          <CardContent className="space-y-6 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Inquiry status
              </span>
              <Badge variant="secondary">
                {inquiryStatusLabel(thread.inquiryStatus)}
              </Badge>
            </div>

            <ConversationTimeline
              messages={thread.messages}
              agentLabel="Clarification agent"
            />

            <Separator />

            <ShipmentForm form={thread.form} formStatus={thread.formStatus} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ClarificationPanel() {
  const [newThreadDraft, setNewThreadDraft] = useState("");
  const [newThreadMissingKeyAlert, setNewThreadMissingKeyAlert] = useState(false);

  const apiKey = useVisitStore((s) => s.apiKey);
  const threads = useVisitStore((s) => s.clarificationThreads);
  const selectedClarificationThreadId = useVisitStore(
    (s) => s.selectedClarificationThreadId
  );
  const setSelectedClarificationThreadId = useVisitStore(
    (s) => s.setSelectedClarificationThreadId
  );

  const selectedThread =
    threads.find((t) => t.id === selectedClarificationThreadId) ?? null;

  function handleNewThreadSend() {
    if (!apiKey.trim()) {
      setNewThreadMissingKeyAlert(true);
      return;
    }
    setNewThreadMissingKeyAlert(false);
    // New thread + first agent reply wiring comes in a later task.
  }

  const topBar = (
    <AgentMessageComposer
      value={newThreadDraft}
      onChange={setNewThreadDraft}
      onSend={handleNewThreadSend}
      showMissingKeyAlert={newThreadMissingKeyAlert}
      missingKeyContext="(Send is not wired yet — this will create a new thread and run the clarification agent.)"
      placeholder="Type or paste the simulated customer email…"
      hint="Send creates a new clarification thread. The agent will reply automatically once wired."
    />
  );

  return (
    <AgentPanelChrome title="Clarification Agent" topBar={topBar}>
      <AgentThreadList
        listLabel="Threads"
        items={threads.map((thread) => ({
          id: thread.id,
          title: thread.title,
          subtitle:
            thread.needsHuman && thread.humanReason
              ? thread.humanReason
              : inquiryStatusLabel(thread.inquiryStatus),
          needsHuman: thread.needsHuman,
          createdAt: thread.createdAt,
        }))}
        selectedId={selectedClarificationThreadId}
        onSelect={setSelectedClarificationThreadId}
        emptyMessage="No threads yet. Send a simulated customer email above to create one."
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {selectedThread ? (
          <ClarificationThreadWindow
            key={selectedThread.id}
            thread={selectedThread}
          />
        ) : (
          <AgentDetailPlaceholder message="Select a thread to reply as the customer and view the conversation and shipment form." />
        )}
      </div>
    </AgentPanelChrome>
  );
}
