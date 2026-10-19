import { connection } from "next/server";

import { runClarificationStart } from "@/lib/agent/clarification/clarify";
import { listThreads } from "@/lib/clarification/store";
import {
  jsonError,
  jsonResult,
  parseLlmRequestBody,
  readJsonBody,
} from "@/lib/http";

export async function GET() {
  const threadsPromise = listThreads();
  await connection();
  const threads = await threadsPromise;
  return jsonResult({ threads });
}

export async function POST(request: Request) {
  const connectionPromise = connection();
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) {
    return jsonError("invalid_json", 400);
  }

  const parsed = parseLlmRequestBody(parsedBody.body);
  if (!parsed.ok) {
    return jsonError(parsed.error, 400);
  }

  await connectionPromise;
  const thread = await runClarificationStart({
    apiKey: parsed.apiKey,
    message: parsed.message,
    provider: parsed.provider,
  });
  return jsonResult({ thread });
}
