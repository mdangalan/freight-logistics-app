import { cn } from "@/lib/utils";

export type StatusTone = "ok" | "waiting" | "human";

const TONE_DOT: Record<StatusTone, string> = {
  ok: "bg-emerald-500",
  waiting: "bg-orange-500",
  human: "bg-red-500",
};

type ItemStatusDotProps = {
  tone?: StatusTone;
};

export function ItemStatusDot({ tone = "ok" }: ItemStatusDotProps) {
  return (
    <span
      className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", TONE_DOT[tone])}
      aria-hidden
    />
  );
}
