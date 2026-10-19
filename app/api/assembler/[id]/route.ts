import { connection } from "next/server";

import { jsonError, jsonResult, parsePatchAction, readJsonBody } from "@/lib/http";
import { clearHumanFlag, getItem } from "@/lib/items/store";

type ItemRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ItemRouteContext) {
  const connectionPromise = connection();
  const { id } = await context.params;
  const itemPromise = getItem(id);
  await connectionPromise;
  const item = await itemPromise;
  if (!item) {
    return jsonError("not_found", 404);
  }
  return jsonResult({ item });
}

export async function PATCH(request: Request, context: ItemRouteContext) {
  const connectionPromise = connection();
  const paramsPromise = context.params;
  const parsedBody = await readJsonBody(request);
  const body = parsedBody.ok ? parsedBody.body : {};

  if (parsePatchAction(body) !== "clearHumanFlag") {
    return jsonError("unsupported_action", 400);
  }

  const [{ id }] = await Promise.all([paramsPromise, connectionPromise]);
  const item = await clearHumanFlag(id);
  if (!item) {
    return jsonError("not_found", 404);
  }
  return jsonResult({ item });
}
