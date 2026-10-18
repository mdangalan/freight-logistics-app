import {
  ASSEMBLER_PROMPT,
  fillAssemblerPrompt,
} from "@/lib/agent/assemblerPrompt";
import { invokeCursorAssembler } from "@/lib/agent/cursorClient";
import { invokeGeminiAssembler, logGeminiError } from "@/lib/agent/geminiClient";
import { applyAssemblerGuardrail } from "@/lib/agent/guardrail";
import { invokeOpenAiAssembler, logOpenAiError } from "@/lib/agent/openaiClient";
import type { LlmProvider } from "@/lib/agent/provider";
import type { AssemblerModelOutput } from "@/lib/agent/schema";
import { sampleCustomersJson } from "@/lib/data/customers";
import {
  createEmptyShipmentForm,
  type AssemblerItem,
} from "@/lib/form/catalog";
import { checkAssemblerForm } from "@/lib/form/validate";
import { createDraftItem, saveItem } from "@/lib/items/store";

const UNREADABLE_REASON = "The assistant could not answer.";

function amberItem(item: AssemblerItem, reason: string): AssemblerItem {
  return {
    ...item,
    needsHuman: true,
    humanReason: reason,
    reply: "",
    form: createEmptyShipmentForm(),
    formStatus: "incomplete",
  };
}

async function callAssemblerModel(
  provider: LlmProvider,
  apiKey: string,
  message: string
): Promise<AssemblerModelOutput> {
  const instructions = fillAssemblerPrompt(
    ASSEMBLER_PROMPT,
    message,
    sampleCustomersJson()
  );

  if (provider === "cursor") {
    return invokeCursorAssembler(apiKey, instructions);
  }
  if (provider === "openai") {
    return invokeOpenAiAssembler(apiKey, message, instructions);
  }
  return invokeGeminiAssembler(apiKey, message, instructions);
}

export async function runAssemblerSend(args: {
  apiKey: string;
  message: string;
  provider: LlmProvider;
}): Promise<AssemblerItem> {
  const item = await saveItem(createDraftItem(args.message));

  try {
    const parsed = await callAssemblerModel(
      args.provider,
      args.apiKey,
      args.message
    );
    const formCheck = checkAssemblerForm(parsed.form, args.message);
    const guardrail = applyAssemblerGuardrail({
      chatText: args.message,
      needsHuman: parsed.needsHuman,
      modelReason: parsed.reason,
      readable: formCheck.ok,
    });

    if (guardrail.tripped || !formCheck.ok) {
      return saveItem(
        amberItem(
          item,
          guardrail.tripped ? guardrail.reason : UNREADABLE_REASON
        )
      );
    }

    return saveItem({
      ...item,
      needsHuman: false,
      humanReason: "",
      reply: parsed.reply,
      form: formCheck.form,
      formStatus: formCheck.formStatus,
    });
  } catch (error) {
    if (args.provider === "openai") {
      logOpenAiError(error, process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini");
    } else if (args.provider === "cursor") {
      console.error("Assembler Cursor call failed", error);
    } else {
      logGeminiError(error, process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash");
    }
    return saveItem(amberItem(item, UNREADABLE_REASON));
  }
}
