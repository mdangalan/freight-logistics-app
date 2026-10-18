import { connection } from "next/server";

import { clearHumanFlag, getItem } from "@/lib/items/store";

type ItemRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ItemRouteContext) {
  await connection();
  const { id } = await context.params;
  const item = await getItem(id);
  if (!item) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(
    { item },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request, context: ItemRouteContext) {
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

  const item = await clearHumanFlag(id);
  if (!item) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(
    { item },
    { headers: { "Cache-Control": "no-store" } }
  );
}
