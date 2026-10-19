import { promises as fs } from "node:fs";
import path from "node:path";

import {
  createEmptyShipmentForm,
  type ClarificationMessage,
  type ClarificationThread,
  type InquiryStatus,
} from "@/lib/form/catalog";

const THREADS_PATH = path.join(
  process.cwd(),
  "data",
  "clarification-threads.json"
);
const SEED_PATH = path.join(
  process.cwd(),
  "data",
  "mock-clarification-threads.json"
);

let writeChain: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isInquiryStatus(value: unknown): value is InquiryStatus {
  return value === "clarifying" || value === "awaiting_customer";
}

function isMessage(value: unknown): value is ClarificationMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ClarificationMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "assistant" || message.role === "customer") &&
    typeof message.content === "string" &&
    typeof message.sentAt === "string"
  );
}

function isThread(value: unknown): value is ClarificationThread {
  if (!value || typeof value !== "object") return false;
  const thread = value as Partial<ClarificationThread>;
  return (
    typeof thread.id === "string" &&
    typeof thread.title === "string" &&
    typeof thread.createdAt === "string" &&
    isInquiryStatus(thread.inquiryStatus) &&
    Array.isArray(thread.messages) &&
    thread.messages.every(isMessage)
  );
}

function titleFromMessage(message: string): string {
  const firstLine = message.trim().split(/\r?\n/, 1)[0] ?? "";
  const collapsed = firstLine.replace(/\s+/g, " ").trim();
  if (!collapsed) return "Untitled";
  if (collapsed.length <= 72) return collapsed;
  return `${collapsed.slice(0, 71)}…`;
}

async function readJsonThreads(filePath: string): Promise<ClarificationThread[]> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isThread);
}

async function writeThreadsFile(threads: ClarificationThread[]): Promise<void> {
  await fs.mkdir(path.dirname(THREADS_PATH), { recursive: true });
  await fs.writeFile(
    THREADS_PATH,
    `${JSON.stringify(threads, null, 2)}\n`,
    "utf8"
  );
}

function newestFirst(threads: ClarificationThread[]): ClarificationThread[] {
  return threads.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function readThreadsFile(): Promise<ClarificationThread[]> {
  try {
    return await readJsonThreads(THREADS_PATH);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  try {
    const seeded = await readJsonThreads(SEED_PATH);
    await writeThreadsFile(seeded);
    return seeded;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export function createDraftThread(message: string): ClarificationThread {
  const now = new Date().toISOString();
  const content = message.trim();
  return {
    id: crypto.randomUUID(),
    title: titleFromMessage(content),
    needsHuman: false,
    humanReason: "",
    inquiryStatus: "clarifying",
    form: createEmptyShipmentForm(),
    formStatus: "incomplete",
    messages: [
      {
        id: crypto.randomUUID(),
        role: "customer",
        content,
        sentAt: now,
      },
    ],
    createdAt: now,
  };
}

export function appendCustomerMessage(
  thread: ClarificationThread,
  message: string
): ClarificationThread {
  const content = message.trim();
  return {
    ...thread,
    messages: [
      ...thread.messages,
      {
        id: crypto.randomUUID(),
        role: "customer",
        content,
        sentAt: new Date().toISOString(),
      },
    ],
  };
}

export async function listThreads(): Promise<ClarificationThread[]> {
  return newestFirst(await readThreadsFile());
}

export async function getThread(
  id: string
): Promise<ClarificationThread | null> {
  const threads = await readThreadsFile();
  return threads.find((thread) => thread.id === id) ?? null;
}

export async function saveThread(
  next: ClarificationThread
): Promise<ClarificationThread> {
  return withWriteLock(async () => {
    const threads = await readThreadsFile();
    const exists = threads.some((thread) => thread.id === next.id);
    const updated = exists
      ? threads.map((thread) => (thread.id === next.id ? next : thread))
      : [next, ...threads];
    await writeThreadsFile(updated);
    return next;
  });
}

export async function clearClarificationHumanFlag(
  id: string
): Promise<ClarificationThread | null> {
  return withWriteLock(async () => {
    const threads = await readThreadsFile();
    const current = threads.find((thread) => thread.id === id);
    if (!current) return null;
    const next: ClarificationThread = {
      ...current,
      needsHuman: false,
      humanReason: "",
    };
    await writeThreadsFile(
      threads.map((thread) => (thread.id === id ? next : thread))
    );
    return next;
  });
}
