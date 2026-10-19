import { connection } from "next/server";

import { runClarificationReply } from "@/lib/agent/clarification/clarify";
import {
  DEFAULT_LLM_PROVIDER,
  parseLlmProvider,
} from "@/lib/agent/provider";
import {
  clearClarificationHumanFlag,
  getThread,
} from "@/lib/clarification/store";

type ThreadRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ThreadRouteContext) {
  await connection();
  const { id } = await context.params;
  const thread = await getThread(id);
  if (!thread) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(
    { thread },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request, context: ThreadRouteContext) {
  await connection();
  const { id } = await context.params;

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

  const thread = await runClarificationReply({
    threadId: id,
    apiKey,
    message,
    provider,
  });
  if (!thread) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(
    { thread },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request, context: ThreadRouteContext) {
  await connection();
  const { id } = await context.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action =
    body && typeof body === "object" && "action" in body
      ? (body as { action?: unknown }).action
      : undefined;

  if (action !== "clearHumanFlag") {
    return Response.json({ error: "unsupported_action" }, { status: 400 });
  }

  const thread = await clearClarificationHumanFlag(id);
  if (!thread) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(
    { thread },
    { headers: { "Cache-Control": "no-store" } }
  );
}
