import { create } from "zustand";
import type { Tab } from "@/types/tab";

const DEFAULT_TAB: Tab = { id: "default", name: "일상" };

type TabState = {
  tabs: Tab[];
  activeTabId: string;
  addTab: (name: string) => void; // 생성 후 해당 탭을 활성화
  setActiveTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  removeTab: (id: string) => void; // 최소 1개는 유지
};

export const useTabStore = create<TabState>((set) => ({
  tabs: [DEFAULT_TAB],
  activeTabId: DEFAULT_TAB.id,

  addTab: (name) =>
    set((s) => {
      const id = `tab-${Date.now()}`;
      return { tabs: [...s.tabs, { id, name: name.trim() }], activeTabId: id };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  renameTab: (id, name) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)),
    })),

  removeTab: (id) =>
    set((s) => {
      if (s.tabs.length <= 1) return s; // 마지막 탭은 삭제 불가
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeTabId = s.activeTabId === id ? tabs[0].id : s.activeTabId;
      return { tabs, activeTabId };
    }),
}));
