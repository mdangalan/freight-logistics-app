import OpenAI from "openai";

import { parseModelOutput } from "@/lib/agent/parseOutput";
import { ASSEMBLER_OUTPUT_SCHEMA } from "@/lib/agent/schema";
import type { AssemblerModelOutput } from "@/lib/agent/schema";

const DEFAULT_MODEL = "gpt-4o-mini";
const FALLBACK_MODEL = "gpt-4.1-nano";

function usesGpt6Reasoning(model: string): boolean {
  return /^gpt-6/i.test(model);
}

function openaiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export function logOpenAiError(
  error: unknown,
  model: string,
  caller = "Assembler"
) {
  if (error instanceof OpenAI.APIError) {
    console.error(`${caller} OpenAI call failed`, {
      model,
      status: error.status,
      code: error.code,
      type: error.type,
      message: error.message,
    });
    return;
  }
  console.error(`${caller} OpenAI call failed`, { model, error });
}

function shouldTryFallbackModel(error: unknown, model: string): boolean {
  if (model === FALLBACK_MODEL) return false;
  if (process.env.OPENAI_MODEL?.trim()) return false;

  if (error instanceof OpenAI.AuthenticationError) return false;
  if (error instanceof OpenAI.NotFoundError) return true;
  if (error instanceof OpenAI.PermissionDeniedError) return true;
  if (error instanceof OpenAI.BadRequestError) {
    const message = error.message.toLowerCase();
    return (
      message.includes("model") ||
      message.includes("reasoning") ||
      message.includes("json_schema")
    );
  }
  return false;
}

async function invokeOpenAiModel(
  apiKey: string,
  message: string,
  instructions: string,
  model: string
): Promise<AssemblerModelOutput> {
  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model,
    store: false,
    instructions,
    input: message,
    ...(usesGpt6Reasoning(model)
      ? { reasoning: { effort: "low" as const } }
      : {}),
    text: {
      format: {
        type: "json_schema",
        name: "assembler_output",
        strict: true,
        schema: ASSEMBLER_OUTPUT_SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });

  if (response.error) {
    throw new Error(response.error.message ?? "response_error");
  }
  if (response.status === "failed" || response.status === "incomplete") {
    throw new Error(
      response.incomplete_details?.reason ?? `response_${response.status}`
    );
  }

  const outputText = response.output_text?.trim();
  if (!outputText) {
    throw new Error("empty_output");
  }
  const parsed = parseModelOutput(outputText);
  if (!parsed) {
    throw new Error("unreadable_output");
  }
  return parsed;
}

export async function invokeOpenAiAssembler(
  apiKey: string,
  message: string,
  instructions: string,
  caller = "Assembler"
): Promise<AssemblerModelOutput> {
  const primaryModel = openaiModel();
  try {
    return await invokeOpenAiModel(apiKey, message, instructions, primaryModel);
  } catch (error) {
    logOpenAiError(error, primaryModel, caller);
    if (shouldTryFallbackModel(error, primaryModel)) {
      console.warn(
        `${caller} retrying with ${FALLBACK_MODEL} (set OPENAI_MODEL in .env.local to pin a model)`
      );
      return await invokeOpenAiModel(
        apiKey,
        message,
        instructions,
        FALLBACK_MODEL
      );
    }
    throw error;
  }
}
