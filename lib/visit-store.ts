"use client";

import { create } from "zustand";

import mockAssemblerItems from "@/data/mock-assembler-items.json";
import mockClarificationThreads from "@/data/mock-clarification-threads.json";
import type { AssemblerItem, ClarificationThread } from "@/lib/form/catalog";

const MOCK_ASSEMBLER_ITEMS = mockAssemblerItems as AssemblerItem[];
const MOCK_CLARIFICATION_THREADS =
  mockClarificationThreads as ClarificationThread[];

export type VisitSection =
  | "assembler"
  | "clarification"
  | "booking"
  | "settings";

type VisitState = {
  section: VisitSection;
  selectedItemId: string | null;
  selectedClarificationThreadId: string | null;
  apiKey: string;
  /** Preview list only — persisted items.json wiring comes later. */
  items: AssemblerItem[];
  clarificationThreads: ClarificationThread[];
  setSection: (section: VisitSection) => void;
  setSelectedItemId: (id: string | null) => void;
  setSelectedClarificationThreadId: (id: string | null) => void;
  setApiKey: (apiKey: string) => void;
  clearHumanFlag: (itemId: string) => void;
  clearClarificationHumanFlag: (threadId: string) => void;
};

export const useVisitStore = create<VisitState>((set) => ({
  section: "assembler",
  selectedItemId: MOCK_ASSEMBLER_ITEMS[0]?.id ?? null,
  selectedClarificationThreadId:
    MOCK_CLARIFICATION_THREADS[0]?.id ?? null,
  apiKey: "",
  items: MOCK_ASSEMBLER_ITEMS,
  clarificationThreads: MOCK_CLARIFICATION_THREADS,
  setSection: (section) => set({ section }),
  setSelectedItemId: (selectedItemId) => set({ selectedItemId }),
  setSelectedClarificationThreadId: (selectedClarificationThreadId) =>
    set({ selectedClarificationThreadId }),
  setApiKey: (apiKey) => set({ apiKey }),
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
