import { connection } from "next/server";

import { runAssemblerSend } from "@/lib/agent/assemble";
import {
  DEFAULT_LLM_PROVIDER,
  parseLlmProvider,
} from "@/lib/agent/provider";
import { listItems } from "@/lib/items/store";

export async function GET() {
  await connection();
  const items = await listItems();
  return Response.json(
    { items },
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
  const provider =
    parseLlmProvider(record.provider) ?? DEFAULT_LLM_PROVIDER;

  if (!apiKey) {
    return Response.json({ error: "missing_api_key" }, { status: 400 });
  }
  if (!message) {
    return Response.json({ error: "empty_message" }, { status: 400 });
  }

  const item = await runAssemblerSend({ apiKey, message, provider });
  return Response.json(
    { item },
    { headers: { "Cache-Control": "no-store" } }
  );
}
