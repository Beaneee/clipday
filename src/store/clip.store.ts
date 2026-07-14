import { create } from "zustand";
import type { Clip } from "@/types/clip";

type ClipState = {
  clips: Record<string, Record<string, Clip[]>>; // tabId → dateKey → clips
  addClip: (tabId: string, clip: Clip) => void;
  removeClip: (tabId: string, dateKey: string, id: string) => void;
  clearTab: (tabId: string) => void; // 탭 삭제 시 해당 탭 기록 제거
};

export const useClipStore = create<ClipState>((set) => ({
  clips: {},

  addClip: (tabId, clip) =>
    set((state) => {
      const tabClips = state.clips[tabId] ?? {};
      const prev = tabClips[clip.dateKey] ?? [];
      return {
        clips: {
          ...state.clips,
          [tabId]: { ...tabClips, [clip.dateKey]: [...prev, clip] },
        },
      };
    }),

  removeClip: (tabId, dateKey, id) =>
    set((state) => {
      const tabClips = state.clips[tabId] ?? {};
      const filtered = (tabClips[dateKey] ?? []).filter((c) => c.id !== id);
      return {
        clips: {
          ...state.clips,
          [tabId]: { ...tabClips, [dateKey]: filtered },
        },
      };
    }),

  clearTab: (tabId) =>
    set((state) => {
      const next = { ...state.clips };
      delete next[tabId];
      return { clips: next };
    }),
}));
