export const LLM_PROVIDERS = ["gemini", "cursor", "openai"] as const;

export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export const DEFAULT_LLM_PROVIDER: LlmProvider = "gemini";

export function parseLlmProvider(value: unknown): LlmProvider | null {
  if (typeof value !== "string") return null;
  return (LLM_PROVIDERS as readonly string[]).includes(value)
    ? (value as LlmProvider)
    : null;
}
