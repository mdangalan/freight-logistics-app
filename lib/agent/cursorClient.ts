import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseModelOutput } from "@/lib/agent/parseOutput";
import { ASSEMBLER_OUTPUT_SCHEMA } from "@/lib/agent/schema";
import type { AssemblerModelOutput } from "@/lib/agent/schema";

const DEFAULT_CURSOR_MODEL = "composer-2.5";

function cursorModel(): string {
  return process.env.CURSOR_MODEL?.trim() || DEFAULT_CURSOR_MODEL;
}

function runResultText(result: {
  status: string;
  result?: string;
  error?: { message?: string };
}): string {
  if (result.status === "error" || result.status === "cancelled") {
    throw new Error(result.error?.message ?? `cursor_run_${result.status}`);
  }
  const value = result.result?.trim();
  if (!value) {
    throw new Error("empty_output");
  }
  return value;
}

export async function invokeCursorAssembler(
  apiKey: string,
  instructions: string
): Promise<AssemblerModelOutput> {
  const { Agent } = await import("@cursor/sdk");
  const cwd = await mkdtemp(path.join(tmpdir(), "freight-assembler-"));
  const model = cursorModel();
  const prompt = `${instructions}

Return JSON only. No markdown. Match this object exactly:
${JSON.stringify(ASSEMBLER_OUTPUT_SCHEMA, null, 2)}
`;

  const result = await Agent.prompt(prompt, {
    apiKey,
    model: { id: model },
    tools: [],
    local: {
      cwd,
      settingSources: [],
    },
  });

  const outputText = runResultText(result);
  const parsed = parseModelOutput(outputText);
  if (!parsed) {
    throw new Error("unreadable_output");
  }
  return parsed;
}
