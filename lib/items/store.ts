import { promises as fs } from "node:fs";
import path from "node:path";

import {
  createEmptyShipmentForm,
  type AssemblerItem,
} from "@/lib/form/catalog";

const ITEMS_PATH = path.join(process.cwd(), "data", "items.json");

let writeChain: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isAssemblerItem(value: unknown): value is AssemblerItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AssemblerItem>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.message === "string" &&
    typeof item.createdAt === "string"
  );
}

async function readItemsFile(): Promise<AssemblerItem[]> {
  try {
    const raw = await fs.readFile(ITEMS_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAssemblerItem);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeItemsFile(items: AssemblerItem[]): Promise<void> {
  await fs.mkdir(path.dirname(ITEMS_PATH), { recursive: true });
  await fs.writeFile(ITEMS_PATH, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

function newestFirst(items: AssemblerItem[]): AssemblerItem[] {
  return items.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function titleFromMessage(message: string): string {
  const firstLine = message.trim().split(/\r?\n/, 1)[0] ?? "";
  const collapsed = firstLine.replace(/\s+/g, " ").trim();
  if (!collapsed) return "Untitled";
  if (collapsed.length <= 72) return collapsed;
  return `${collapsed.slice(0, 71)}…`;
}

export function createDraftItem(message: string): AssemblerItem {
  return {
    id: crypto.randomUUID(),
    title: titleFromMessage(message),
    needsHuman: false,
    humanReason: "",
    message,
    reply: "",
    form: createEmptyShipmentForm(),
    formStatus: "incomplete",
    createdAt: new Date().toISOString(),
  };
}

export async function listItems(): Promise<AssemblerItem[]> {
  return newestFirst(await readItemsFile());
}

export async function getItem(id: string): Promise<AssemblerItem | null> {
  const items = await readItemsFile();
  return items.find((item) => item.id === id) ?? null;
}

export async function saveItem(next: AssemblerItem): Promise<AssemblerItem> {
  return withWriteLock(async () => {
    const items = await readItemsFile();
    const index = items.findIndex((item) => item.id === next.id);
    const updated =
      index >= 0
        ? items.map((item) => (item.id === next.id ? next : item))
        : [next, ...items];
    await writeItemsFile(updated);
    return next;
  });
}

export async function clearHumanFlag(
  id: string
): Promise<AssemblerItem | null> {
  return withWriteLock(async () => {
    const items = await readItemsFile();
    const current = items.find((item) => item.id === id);
    if (!current) return null;
    const next: AssemblerItem = {
      ...current,
      needsHuman: false,
      humanReason: "",
    };
    await writeItemsFile(
      items.map((item) => (item.id === id ? next : item))
    );
    return next;
  });
}
