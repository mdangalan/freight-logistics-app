import { connection } from "next/server";

import { runClarificationStart } from "@/lib/agent/clarification/clarify";
import {
  DEFAULT_LLM_PROVIDER,
  parseLlmProvider,
} from "@/lib/agent/provider";
import { listThreads } from "@/lib/clarification/store";

export async function GET() {
  await connection();
  const threads = await listThreads();
  return Response.json(
    { threads },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  await connection();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const record = body as {
    apiKey?: unknown;
    message?: unknown;
    provider?: unknown;
  };
  const apiKey = typeof record.apiKey === "string" ? record.apiKey.trim() : "";
  const message =
    typeof record.message === "string" ? record.message.trim() : "";
  const provider = parseLlmProvider(record.provider) ?? DEFAULT_LLM_PROVIDER;

  if (!apiKey) {
    return Response.json({ error: "missing_api_key" }, { status: 400 });
  }
  if (!message) {
    return Response.json({ error: "empty_message" }, { status: 400 });
  }

  const thread = await runClarificationStart({ apiKey, message, provider });
  return Response.json(
    { thread },
    { headers: { "Cache-Control": "no-store" } }
  );
}
