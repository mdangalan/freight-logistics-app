"use client";

import { create } from "zustand";

import {
  DEFAULT_LLM_PROVIDER,
  type LlmProvider,
} from "@/lib/agent/provider";
import type { AssemblerItem, ClarificationThread } from "@/lib/form/catalog";

export type VisitSection =
  | "assembler"
  | "clarification"
  | "booking"
  | "settings";

function newestFirst(items: AssemblerItem[]): AssemblerItem[] {
  return items.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function newestThreads(threads: ClarificationThread[]): ClarificationThread[] {
  return threads.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
}

type VisitState = {
  section: VisitSection;
  visitedSections: VisitSection[];
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
  setClarificationThreads: (threads: ClarificationThread[]) => void;
  upsertClarificationThread: (thread: ClarificationThread) => void;
};

export const useVisitStore = create<VisitState>((set) => ({
  section: "assembler",
  visitedSections: ["assembler"],
  selectedItemId: null,
  selectedClarificationThreadId: null,
  llmProvider: DEFAULT_LLM_PROVIDER,
  apiKey: "",
  items: [],
  clarificationThreads: [],
  setSection: (section) =>
    set((state) => ({
      section,
      visitedSections: state.visitedSections.includes(section)
        ? state.visitedSections
        : [...state.visitedSections, section],
    })),
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
  setClarificationThreads: (threads) =>
    set({ clarificationThreads: newestThreads(threads) }),
  upsertClarificationThread: (thread) =>
    set((state) => ({
      clarificationThreads: newestThreads([
        thread,
        ...state.clarificationThreads.filter(
          (existing) => existing.id !== thread.id
        ),
      ]),
    })),
}));
