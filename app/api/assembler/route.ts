import { connection } from "next/server";

import { runAssemblerSend } from "@/lib/agent/assembler/assemble";
import {
  jsonError,
  jsonResult,
  parseLlmRequestBody,
  readJsonBody,
} from "@/lib/http";
import { listItems } from "@/lib/items/store";

export async function GET() {
  const itemsPromise = listItems();
  await connection();
  const items = await itemsPromise;
  return jsonResult({ items });
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
  const item = await runAssemblerSend({
    apiKey: parsed.apiKey,
    message: parsed.message,
    provider: parsed.provider,
  });
  return jsonResult({ item });
}
