import { connection } from "next/server";

import { runClarificationReply } from "@/lib/agent/clarification/clarify";
import {
  clearClarificationHumanFlag,
  getThread,
} from "@/lib/clarification/store";
import {
  jsonError,
  jsonResult,
  parseLlmRequestBody,
  parsePatchAction,
  readJsonBody,
} from "@/lib/http";

type ThreadRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ThreadRouteContext) {
  const connectionPromise = connection();
  const { id } = await context.params;
  const threadPromise = getThread(id);
  await connectionPromise;
  const thread = await threadPromise;
  if (!thread) {
    return jsonError("not_found", 404);
  }
  return jsonResult({ thread });
}

export async function POST(request: Request, context: ThreadRouteContext) {
  const connectionPromise = connection();
  const paramsPromise = context.params;
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) {
    return jsonError("invalid_json", 400);
  }

  const parsed = parseLlmRequestBody(parsedBody.body);
  if (!parsed.ok) {
    return jsonError(parsed.error, 400);
  }

  const [{ id }] = await Promise.all([paramsPromise, connectionPromise]);
  const thread = await runClarificationReply({
    threadId: id,
    apiKey: parsed.apiKey,
    message: parsed.message,
    provider: parsed.provider,
  });
  if (!thread) {
    return jsonError("not_found", 404);
  }
  return jsonResult({ thread });
}

export async function PATCH(request: Request, context: ThreadRouteContext) {
  const connectionPromise = connection();
  const paramsPromise = context.params;
  const parsedBody = await readJsonBody(request);
  const body = parsedBody.ok ? parsedBody.body : {};

  if (parsePatchAction(body) !== "clearHumanFlag") {
    return jsonError("unsupported_action", 400);
  }

  const [{ id }] = await Promise.all([paramsPromise, connectionPromise]);
  const thread = await clearClarificationHumanFlag(id);
  if (!thread) {
    return jsonError("not_found", 404);
  }
  return jsonResult({ thread });
}
