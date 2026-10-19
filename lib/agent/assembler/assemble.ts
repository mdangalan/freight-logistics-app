import {
  ASSEMBLER_PROMPT,
  fillAssemblerPrompt,
} from "@/lib/agent/assembler/prompt";
import { applyAssemblerGuardrail } from "@/lib/agent/guardrail";
import {
  invokeAssemblerModel,
  logAssemblerInvokeError,
} from "@/lib/agent/invoke";
import type { LlmProvider } from "@/lib/agent/provider";
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
) {
  return invokeAssemblerModel(
    provider,
    apiKey,
    message,
    fillAssemblerPrompt(ASSEMBLER_PROMPT, message, sampleCustomersJson())
  );
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
    await logAssemblerInvokeError(args.provider, error);
    return saveItem(amberItem(item, UNREADABLE_REASON));
  }
}
