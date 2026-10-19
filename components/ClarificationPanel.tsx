"use client";

import { useEffect, useRef, useState } from "react";

import { AgentDetailPlaceholder } from "@/components/agent/AgentDetailPlaceholder";
import { AgentMessageComposer } from "@/components/agent/AgentMessageComposer";
import { AgentPanelChrome } from "@/components/agent/AgentPanelChrome";
import { AgentSendAlerts } from "@/components/agent/AgentSendAlerts";
import { AgentThreadList } from "@/components/agent/AgentThreadList";
import { ConversationTimeline } from "@/components/agent/ConversationTimeline";
import { CustomerReplyComposer } from "@/components/agent/CustomerReplyComposer";
import { HumanReviewHeader } from "@/components/agent/HumanReviewHeader";
import { PendingSendTimeline } from "@/components/agent/PendingSendTimeline";
import { ShipmentForm } from "@/components/ShipmentForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  ClarificationMessage,
  ClarificationThread,
  InquiryStatus,
} from "@/lib/form/catalog";
import { useVisitStore } from "@/lib/visit-store";

function inquiryStatusLabel(status: InquiryStatus) {
  return status === "awaiting_customer" ? "Awaiting customer" : "Clarifying";
}

function threadSubtitle(thread: ClarificationThread) {
  if (thread.needsHuman && thread.humanReason) return thread.humanReason;
  if (thread.formStatus === "complete") return "Form complete";
  return inquiryStatusLabel(thread.inquiryStatus);
}

function threadTone(thread: ClarificationThread) {
  if (thread.needsHuman) return "human" as const;
  if (thread.formStatus === "complete") return "ok" as const;
  return "waiting" as const;
}

function clarificationListItems(threads: ClarificationThread[]) {
  return threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    subtitle: threadSubtitle(thread),
    needsHuman: thread.needsHuman,
    tone: threadTone(thread),
    createdAt: thread.createdAt,
  }));
}

function ClarificationThreadWindow({ thread }: { thread: ClarificationThread }) {
  const upsertThread = useVisitStore((s) => s.upsertClarificationThread);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyMissingKeyAlert, setReplyMissingKeyAlert] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendNotice, setSendNotice] = useState("");
  const [pendingTimeline, setPendingTimeline] = useState<
    ClarificationMessage[] | null
  >(null);
  const sendingRef = useRef(false);
  const clearingRef = useRef(false);

  const timelineMessages = pendingTimeline ?? thread.messages;

  async function handleClearHumanFlag() {
    if (clearingRef.current) return;
    clearingRef.current = true;
    try {
      const response = await fetch(`/api/clarification/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearHumanFlag" }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        thread?: ClarificationThread;
      };
      if (payload.thread) upsertThread(payload.thread);
    } finally {
      clearingRef.current = false;
    }
  }

  async function handleThreadReplySend() {
    const { apiKey, llmProvider } = useVisitStore.getState();
    if (!apiKey.trim()) {
      setReplyMissingKeyAlert(true);
      setSendError("");
      return;
    }
    const message = replyDraft.trim();
    if (!message || sendingRef.current) return;
    if (thread.needsHuman) {
      setSendError("");
      setSendNotice(
        "This thread is waiting for a person. Use I've got this before the agent replies again."
      );
      return;
    }

    const pending: ClarificationMessage = {
      id: `pending-${crypto.randomUUID()}`,
      role: "customer",
      content: message,
      sentAt: new Date().toISOString(),
    };
    sendingRef.current = true;
    setReplyMissingKeyAlert(false);
    setSendError("");
    setSendNotice("");
    setPendingTimeline([...thread.messages, pending]);
    setIsSending(true);
    try {
      const response = await fetch(`/api/clarification/${thread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, message, provider: llmProvider }),
      });
      const payload = (await response.json().catch(() => null)) as {
        thread?: ClarificationThread;
        error?: string;
      } | null;

      if (response.status === 400 && payload?.error === "missing_api_key") {
        setReplyMissingKeyAlert(true);
        return;
      }
      if (!response.ok || !payload?.thread) {
        setSendError("The assistant could not answer. Try again.");
        return;
      }

      upsertThread(payload.thread);
      setReplyDraft("");
      if (
        payload.thread.needsHuman &&
        payload.thread.messages.at(-1)?.role === "customer"
      ) {
        setSendNotice(
          payload.thread.humanReason ||
            "The assistant could not answer. Check Settings and the dev-server terminal."
        );
      }
    } catch {
      setSendError("The assistant could not answer. Try again.");
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      setPendingTimeline(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 border-b bg-background p-4">
        <CustomerReplyComposer
          value={replyDraft}
          onChange={setReplyDraft}
          onSend={handleThreadReplySend}
          showMissingKeyAlert={replyMissingKeyAlert}
          isSending={isSending}
          hint="Reply as the customer. The agent updates this form from the reply and asks only about fields that are still missing, unclear, or in conflict."
        />
        <AgentSendAlerts error={sendError} notice={sendNotice} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        <Card className="border-border/80 shadow-sm">
          <HumanReviewHeader
            cardTitle="Selected thread"
            needsHuman={thread.needsHuman}
            humanReason={thread.humanReason}
            onClearHumanFlag={
              thread.needsHuman ? handleClearHumanFlag : undefined
            }
          />
          <CardContent className="space-y-6 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Inquiry status
              </span>
              <Badge
                variant="secondary"
                className={
                  thread.needsHuman
                    ? "bg-red-500/15 text-red-900 dark:text-red-100"
                    : "bg-orange-500/15 text-orange-900 dark:text-orange-100"
                }
              >
                {inquiryStatusLabel(thread.inquiryStatus)}
              </Badge>
            </div>

            <ConversationTimeline
              messages={timelineMessages}
              agentLabel="Clarification agent"
              awaitingReply={pendingTimeline !== null}
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
  const [newThreadMissingKeyAlert, setNewThreadMissingKeyAlert] =
    useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingSend, setPendingSend] = useState<{
    content: string;
    sentAt: string;
  } | null>(null);
  const [sendError, setSendError] = useState("");
  const [sendNotice, setSendNotice] = useState("");
  const sendingRef = useRef(false);

  const threads = useVisitStore((s) => s.clarificationThreads);
  const selectedClarificationThreadId = useVisitStore(
    (s) => s.selectedClarificationThreadId
  );
  const setSelectedClarificationThreadId = useVisitStore(
    (s) => s.setSelectedClarificationThreadId
  );
  const setClarificationThreads = useVisitStore(
    (s) => s.setClarificationThreads
  );
  const upsertClarificationThread = useVisitStore(
    (s) => s.upsertClarificationThread
  );

  const selectedThread =
    threads.find((thread) => thread.id === selectedClarificationThreadId) ??
    null;
  const listItems = clarificationListItems(threads);

  useEffect(() => {
    let cancelled = false;
    async function loadThreads() {
      try {
        const response = await fetch("/api/clarification", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          threads?: ClarificationThread[];
        };
        if (cancelled || !Array.isArray(payload.threads)) return;
        setClarificationThreads(payload.threads);
        const current = useVisitStore.getState().selectedClarificationThreadId;
        if (
          current &&
          payload.threads.some((thread) => thread.id === current)
        ) {
          return;
        }
        setSelectedClarificationThreadId(payload.threads[0]?.id ?? null);
      } catch {
        // The list stays empty until a send succeeds.
      }
    }
    void loadThreads();
    return () => {
      cancelled = true;
    };
  }, [setClarificationThreads, setSelectedClarificationThreadId]);

  async function handleNewThreadSend() {
    const { apiKey, llmProvider } = useVisitStore.getState();
    if (!apiKey.trim()) {
      setNewThreadMissingKeyAlert(true);
      setSendError("");
      return;
    }
    const message = newThreadDraft.trim();
    if (!message || sendingRef.current) return;

    sendingRef.current = true;
    setNewThreadMissingKeyAlert(false);
    setSendError("");
    setSendNotice("");
    setPendingSend({ content: message, sentAt: new Date().toISOString() });
    setIsSending(true);
    try {
      const response = await fetch("/api/clarification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, message, provider: llmProvider }),
      });
      const payload = (await response.json().catch(() => null)) as {
        thread?: ClarificationThread;
        error?: string;
      } | null;

      if (response.status === 400 && payload?.error === "missing_api_key") {
        setNewThreadMissingKeyAlert(true);
        return;
      }
      if (!response.ok || !payload?.thread) {
        setSendError("The assistant could not answer. Try again.");
        return;
      }

      upsertClarificationThread(payload.thread);
      setSelectedClarificationThreadId(payload.thread.id);
      setNewThreadDraft("");
      if (
        payload.thread.needsHuman &&
        payload.thread.messages.at(-1)?.role === "customer"
      ) {
        setSendNotice(
          payload.thread.humanReason ||
            "The assistant could not answer. Check Settings and the dev-server terminal."
        );
      }
    } catch {
      setSendError("The assistant could not answer. Try again.");
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      setPendingSend(null);
    }
  }

  const topBar = (
    <>
      <p className="text-sm text-muted-foreground">
        Clarification clarifies — it does not replace Assembler for complete
        intake. Use this agent when the order still has missing, unclear, or
        conflicting shipment fields. Send above to start a new thread from the
        customer&apos;s message, or select a thread and reply at the bottom as
        the customer to continue the conversation. The agent asks only for what
        is still open, updates the form each turn, and assembles the confirmation
        email once every field is complete. If the first message already has full
        details, use Assembler instead. One domestic road shipment of ordinary
        palletized goods per thread.
      </p>
      <AgentMessageComposer
        value={newThreadDraft}
        onChange={setNewThreadDraft}
        onSend={handleNewThreadSend}
        showMissingKeyAlert={newThreadMissingKeyAlert}
        isSending={isSending}
        placeholder="Type or paste the simulated customer email…"
      />
      <AgentSendAlerts error={sendError} notice={sendNotice} />
    </>
  );

  return (
    <AgentPanelChrome title="Clarification Agent" preview={false} topBar={topBar}>
      <AgentThreadList
        listLabel="Threads"
        items={listItems}
        selectedId={selectedClarificationThreadId}
        onSelect={setSelectedClarificationThreadId}
        emptyMessage="No threads yet. Send a simulated customer email above to create one."
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {pendingSend ? (
          <PendingSendTimeline
            content={pendingSend.content}
            sentAt={pendingSend.sentAt}
            agentLabel="Clarification agent"
          />
        ) : selectedThread ? (
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
