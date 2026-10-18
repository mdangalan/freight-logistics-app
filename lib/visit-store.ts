"use client";

import { create } from "zustand";

import mockAssemblerItems from "@/data/mock-assembler-items.json";
import type { AssemblerItem } from "@/lib/form/catalog";

const MOCK_ASSEMBLER_ITEMS = mockAssemblerItems as AssemblerItem[];

export type VisitSection =
  | "assembler"
  | "clarification"
  | "booking"
  | "settings";

type VisitState = {
  section: VisitSection;
  selectedItemId: string | null;
  apiKey: string;
  /** Preview list only — persisted items.json wiring comes later. */
  items: AssemblerItem[];
  setSection: (section: VisitSection) => void;
  setSelectedItemId: (id: string | null) => void;
  setApiKey: (apiKey: string) => void;
  clearHumanFlag: (itemId: string) => void;
};

export const useVisitStore = create<VisitState>((set) => ({
  section: "assembler",
  selectedItemId: MOCK_ASSEMBLER_ITEMS[0]?.id ?? null,
  apiKey: "",
  items: MOCK_ASSEMBLER_ITEMS,
  setSection: (section) => set({ section }),
  setSelectedItemId: (selectedItemId) => set({ selectedItemId }),
  setApiKey: (apiKey) => set({ apiKey }),
  clearHumanFlag: (itemId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, needsHuman: false, humanReason: "" }
          : item
      ),
    })),
}));
