"use client";

import { create } from "zustand";

import mockClarificationThreads from "@/data/mock-clarification-threads.json";
import {
  DEFAULT_LLM_PROVIDER,
  type LlmProvider,
} from "@/lib/agent/provider";
import type { AssemblerItem, ClarificationThread } from "@/lib/form/catalog";

const MOCK_CLARIFICATION_THREADS =
  mockClarificationThreads as ClarificationThread[];

export type VisitSection =
  | "assembler"
  | "clarification"
  | "booking"
  | "settings";

function newestFirst(items: AssemblerItem[]): AssemblerItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

type VisitState = {
  section: VisitSection;
  selectedItemId: string | null;
  selectedClarificationThreadId: string | null;
  llmProvider: LlmProvider;
  apiKey: string;
  items: AssemblerItem[];
  clarificationThreads: ClarificationThread[];
  setSection: (section: VisitSection) => void;
  setSelectedItemId: (id: string | null) => void;
  setSelectedClarificationThreadId: (id: string | null) => void;
  setLlmProvider: (provider: LlmProvider) => void;
  setApiKey: (apiKey: string) => void;
  setItems: (items: AssemblerItem[]) => void;
  upsertItem: (item: AssemblerItem) => void;
  clearHumanFlag: (itemId: string) => void;
  clearClarificationHumanFlag: (threadId: string) => void;
};

export const useVisitStore = create<VisitState>((set) => ({
  section: "assembler",
  selectedItemId: null,
  selectedClarificationThreadId:
    MOCK_CLARIFICATION_THREADS[0]?.id ?? null,
  llmProvider: DEFAULT_LLM_PROVIDER,
  apiKey: "",
  items: [],
  clarificationThreads: MOCK_CLARIFICATION_THREADS,
  setSection: (section) => set({ section }),
  setSelectedItemId: (selectedItemId) => set({ selectedItemId }),
  setSelectedClarificationThreadId: (selectedClarificationThreadId) =>
    set({ selectedClarificationThreadId }),
  setLlmProvider: (llmProvider) => set({ llmProvider }),
  setApiKey: (apiKey) => set({ apiKey }),
  setItems: (items) => set({ items: newestFirst(items) }),
  upsertItem: (item) =>
    set((state) => ({
      items: newestFirst([
        item,
        ...state.items.filter((existing) => existing.id !== item.id),
      ]),
    })),
  clearHumanFlag: (itemId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, needsHuman: false, humanReason: "" }
          : item
      ),
    })),
  clearClarificationHumanFlag: (threadId) =>
    set((state) => ({
      clarificationThreads: state.clarificationThreads.map((thread) =>
        thread.id === threadId
          ? { ...thread, needsHuman: false, humanReason: "" }
          : thread
      ),
    })),
}));
