import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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

/**
 * 탭 목록은 기기에 저장한다. 기록은 서버에 tabId로 묶여 있으므로,
 * 탭 목록이 날아가면 그 기록에 다시 접근할 수 없기 때문이다.
 */
export const useTabStore = create<TabState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "clipday.tabs",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ tabs: s.tabs, activeTabId: s.activeTabId }),
      // 저장된 값이 깨져 있어도 앱이 뜨도록 복원 결과를 손본다.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<TabState>;
        const tabs = saved.tabs?.length ? saved.tabs : current.tabs;
        const activeTabId = tabs.some((t) => t.id === saved.activeTabId)
          ? (saved.activeTabId as string)
          : tabs[0].id;
        return { ...current, tabs, activeTabId };
      },
    }
  )
);
