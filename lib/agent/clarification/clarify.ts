import { mergeClarificationForm } from "@/lib/agent/clarification/form";
import {
  CLARIFICATION_PROMPT,
  fillClarificationPrompt,
} from "@/lib/agent/clarification/prompt";
import { applyAssemblerGuardrail } from "@/lib/agent/guardrail";
import {
  invokeAssemblerModel,
  logAssemblerInvokeError,
} from "@/lib/agent/invoke";
import type { LlmProvider } from "@/lib/agent/provider";
import { sampleCustomersJson } from "@/lib/data/customers";
import { checkAssemblerForm } from "@/lib/form/validate";
import {
  createEmptyShipmentForm,
  type ClarificationMessage,
  type ClarificationThread,
} from "@/lib/form/catalog";
import {
  appendCustomerMessage,
  createDraftThread,
  getThread,
  saveThread,
} from "@/lib/clarification/store";

const UNREADABLE_REASON = "The assistant could not answer.";
const CALLER = "Clarification";

function customerTranscript(thread: ClarificationThread): string {
  return thread.messages
    .flatMap((message) => {
      if (message.role !== "customer") return [];
      const content = message.content.trim();
      return content ? [content] : [];
    })
    .join("\n\n");
}

function transcriptForPrompt(thread: ClarificationThread): string {
  if (thread.messages.length === 0) return "(no messages yet)";
  return thread.messages
    .map((message) => {
      const speaker =
        message.role === "customer" ? "Customer" : "Clarification agent";
      return `${speaker}: ${message.content.trim()}`;
    })
    .join("\n\n");
}

function assistantMessage(content: string): ClarificationMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: content.trim(),
    sentAt: new Date().toISOString(),
  };
}

function amberThread(
  thread: ClarificationThread,
  reason: string,
  resetForm: boolean
): ClarificationThread {
  return {
    ...thread,
    needsHuman: true,
    humanReason: reason,
    inquiryStatus: "clarifying",
    form: resetForm ? createEmptyShipmentForm() : thread.form,
    formStatus: resetForm ? "incomplete" : thread.formStatus,
  };
}

async function callClarificationModel(
  provider: LlmProvider,
  apiKey: string,
  thread: ClarificationThread,
  latestMessage: string
) {
  return invokeAssemblerModel(
    provider,
    apiKey,
    latestMessage,
    fillClarificationPrompt(
      CLARIFICATION_PROMPT,
      latestMessage,
      transcriptForPrompt(thread),
      JSON.stringify(
        { formStatus: thread.formStatus, form: thread.form },
        null,
        2
      ),
      sampleCustomersJson()
    ),
    CALLER
  );
}

async function applyClarificationTurn(
  thread: ClarificationThread,
  latestMessage: string,
  args: { apiKey: string; provider: LlmProvider; resetFormOnFailure: boolean }
): Promise<ClarificationThread> {
  try {
    const parsed = await callClarificationModel(
      args.provider,
      args.apiKey,
      thread,
      latestMessage
    );
    const customerText = customerTranscript(thread);
    const formCheck = checkAssemblerForm(parsed.form, customerText);
    const replyPosted = parsed.reply.trim().length > 0;
    const guardrail = applyAssemblerGuardrail({
      chatText: latestMessage,
      needsHuman: parsed.needsHuman,
      modelReason: parsed.reason,
      readable: formCheck.ok && (parsed.needsHuman || replyPosted),
    });

    if (guardrail.tripped || !formCheck.ok || (!parsed.needsHuman && !replyPosted)) {
      return saveThread(
        amberThread(
          thread,
          guardrail.tripped ? guardrail.reason : UNREADABLE_REASON,
          args.resetFormOnFailure
        )
      );
    }

    const merged = mergeClarificationForm(
      thread.form,
      formCheck.form,
      customerText
    );
    return saveThread({
      ...thread,
      needsHuman: false,
      humanReason: "",
      inquiryStatus: "awaiting_customer",
      messages: [...thread.messages, assistantMessage(parsed.reply)],
      form: merged.form,
      formStatus: merged.formStatus,
    });
  } catch (error) {
    await logAssemblerInvokeError(args.provider, error, CALLER);
    return saveThread(
      amberThread(thread, UNREADABLE_REASON, args.resetFormOnFailure)
    );
  }
}

export async function runClarificationStart(args: {
  apiKey: string;
  message: string;
  provider: LlmProvider;
}): Promise<ClarificationThread> {
  const thread = await saveThread(createDraftThread(args.message));
  return applyClarificationTurn(thread, args.message.trim(), {
    apiKey: args.apiKey,
    provider: args.provider,
    resetFormOnFailure: true,
  });
}

export async function runClarificationReply(args: {
  threadId: string;
  apiKey: string;
  message: string;
  provider: LlmProvider;
}): Promise<ClarificationThread | null> {
  const current = await getThread(args.threadId);
  if (!current) return null;
  if (current.needsHuman) return current;
  const thread = await saveThread(
    appendCustomerMessage(current, args.message)
  );
  return applyClarificationTurn(thread, args.message.trim(), {
    apiKey: args.apiKey,
    provider: args.provider,
    resetFormOnFailure: false,
  });
}
