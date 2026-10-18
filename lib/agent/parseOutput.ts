import type { AssemblerModelOutput } from "@/lib/agent/schema";

export function parseModelOutput(text: string): AssemblerModelOutput | null {
  const parsed = parseJsonObject(text);
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Partial<AssemblerModelOutput>;
  if (typeof record.reply !== "string") return null;
  if (typeof record.needsHuman !== "boolean") return null;
  if (typeof record.reason !== "string") return null;
  if (!record.form || typeof record.form !== "object") return null;
  return record as AssemblerModelOutput;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
