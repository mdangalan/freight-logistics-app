import { mergeClarificationForm } from "@/lib/agent/clarification/form";
import {
  CLARIFICATION_PROMPT,
  fillClarificationPrompt,
} from "@/lib/agent/clarification/prompt";
import { invokeCursorAssembler } from "@/lib/agent/cursorClient";
import { invokeGeminiAssembler, logGeminiError } from "@/lib/agent/geminiClient";
import { applyAssemblerGuardrail } from "@/lib/agent/guardrail";
import { invokeOpenAiAssembler, logOpenAiError } from "@/lib/agent/openaiClient";
import type { LlmProvider } from "@/lib/agent/provider";
import type { AssemblerModelOutput } from "@/lib/agent/schema";
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
    .filter((message) => message.role === "customer")
    .map((message) => message.content.trim())
    .filter(Boolean)
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
): Promise<AssemblerModelOutput> {
  const instructions = fillClarificationPrompt(
    CLARIFICATION_PROMPT,
    latestMessage,
    transcriptForPrompt(thread),
    JSON.stringify(
      { formStatus: thread.formStatus, form: thread.form },
      null,
      2
    ),
    sampleCustomersJson()
  );

  if (provider === "cursor") {
    return invokeCursorAssembler(apiKey, instructions);
  }
  if (provider === "openai") {
    return invokeOpenAiAssembler(
      apiKey,
      latestMessage,
      instructions,
      CALLER
    );
  }
  return invokeGeminiAssembler(apiKey, latestMessage, instructions, CALLER);
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
    if (args.provider === "openai") {
      logOpenAiError(
        error,
        process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        CALLER
      );
    } else if (args.provider === "cursor") {
      console.error("Clarification Cursor call failed", error);
    } else {
      logGeminiError(
        error,
        process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash",
        CALLER
      );
    }
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
