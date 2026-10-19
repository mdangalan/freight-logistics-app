import {
  DEFAULT_LLM_PROVIDER,
  parseLlmProvider,
  type LlmProvider,
} from "@/lib/agent/provider";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function jsonResult(data: unknown, status = 200) {
  return Response.json(data, { status, headers: NO_STORE });
}

export function jsonError(error: string, status: number) {
  return jsonResult({ error }, status);
}

export async function readJsonBody(
  request: Request
): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}

export type ParsedLlmRequest =
  | { ok: true; apiKey: string; message: string; provider: LlmProvider }
  | { ok: false; error: "missing_api_key" | "empty_message" };

export function parseLlmRequestBody(body: unknown): ParsedLlmRequest {
  const record = (body ?? {}) as {
    apiKey?: unknown;
    message?: unknown;
    provider?: unknown;
  };
  const apiKey = typeof record.apiKey === "string" ? record.apiKey.trim() : "";
  const message =
    typeof record.message === "string" ? record.message.trim() : "";
  const provider = parseLlmProvider(record.provider) ?? DEFAULT_LLM_PROVIDER;

  if (!apiKey) return { ok: false, error: "missing_api_key" };
  if (!message) return { ok: false, error: "empty_message" };
  return { ok: true, apiKey, message, provider };
}

export function parsePatchAction(body: unknown): unknown {
  if (!body || typeof body !== "object" || !("action" in body)) return undefined;
  return (body as { action?: unknown }).action;
}
