import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";

import { parseModelOutput } from "@/lib/agent/parseOutput";
import { ASSEMBLER_OUTPUT_SCHEMA } from "@/lib/agent/schema";
import type { AssemblerModelOutput } from "@/lib/agent/schema";

const DEFAULT_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

function usesGemini3Thinking(model: string): boolean {
  return /^gemini-3/i.test(model);
}

function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export function logGeminiError(error: unknown, model: string) {
  if (error instanceof ApiError) {
    console.error("Assembler Gemini call failed", {
      model,
      status: error.status,
      message: error.message,
    });
    return;
  }
  console.error("Assembler Gemini call failed", { model, error });
}

function shouldTryFallbackModel(error: unknown, model: string): boolean {
  if (model === FALLBACK_MODEL) return false;
  if (process.env.GEMINI_MODEL?.trim()) return false;

  if (!(error instanceof ApiError)) return false;
  if (error.status === 401 || error.status === 403) return false;
  if (error.status === 404) return true;
  if (error.status === 400) {
    const message = error.message.toLowerCase();
    return (
      message.includes("model") ||
      message.includes("thinking") ||
      message.includes("schema")
    );
  }
  return false;
}

async function invokeGeminiModel(
  apiKey: string,
  message: string,
  instructions: string,
  model: string
): Promise<AssemblerModelOutput> {
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: message,
    config: {
      systemInstruction: instructions,
      ...(usesGemini3Thinking(model)
        ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
        : {}),
      responseMimeType: "application/json",
      responseJsonSchema: ASSEMBLER_OUTPUT_SCHEMA,
    },
  });

  const outputText = response.text?.trim();
  if (!outputText) {
    throw new Error("empty_output");
  }
  const parsed = parseModelOutput(outputText);
  if (!parsed) {
    throw new Error("unreadable_output");
  }
  return parsed;
}

export async function invokeGeminiAssembler(
  apiKey: string,
  message: string,
  instructions: string
): Promise<AssemblerModelOutput> {
  const primaryModel = geminiModel();
  try {
    return await invokeGeminiModel(
      apiKey,
      message,
      instructions,
      primaryModel
    );
  } catch (error) {
    logGeminiError(error, primaryModel);
    if (shouldTryFallbackModel(error, primaryModel)) {
      console.warn(
        `Assembler retrying with ${FALLBACK_MODEL} (set GEMINI_MODEL in .env.local to pin a model)`
      );
      return await invokeGeminiModel(
        apiKey,
        message,
        instructions,
        FALLBACK_MODEL
      );
    }
    throw error;
  }
}
