import type { LlmProvider } from "@/lib/agent/provider";
import type { AssemblerModelOutput } from "@/lib/agent/schema";

export async function invokeAssemblerModel(
  provider: LlmProvider,
  apiKey: string,
  message: string,
  instructions: string,
  caller = "Assembler"
): Promise<AssemblerModelOutput> {
  if (provider === "cursor") {
    const { invokeCursorAssembler } = await import("@/lib/agent/cursorClient");
    return invokeCursorAssembler(apiKey, instructions);
  }
  if (provider === "openai") {
    const { invokeOpenAiAssembler } = await import("@/lib/agent/openaiClient");
    return invokeOpenAiAssembler(apiKey, message, instructions, caller);
  }
  const { invokeGeminiAssembler } = await import("@/lib/agent/geminiClient");
  return invokeGeminiAssembler(apiKey, message, instructions, caller);
}

export async function logAssemblerInvokeError(
  provider: LlmProvider,
  error: unknown,
  caller = "Assembler"
) {
  if (provider === "openai") {
    const { logOpenAiError } = await import("@/lib/agent/openaiClient");
    logOpenAiError(
      error,
      process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      caller
    );
    return;
  }
  if (provider === "cursor") {
    console.error(`${caller} Cursor call failed`, error);
    return;
  }
  const { logGeminiError } = await import("@/lib/agent/geminiClient");
  logGeminiError(
    error,
    process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash",
    caller
  );
}
