import { create } from "zustand";
import type { Clip } from "@/types/clip";

type ClipState = {
  clips: Record<string, Clip[]>; // dateKey → clips
  addClip: (clip: Clip) => void;
  removeClip: (dateKey: string, id: string) => void;
};

export const useClipStore = create<ClipState>((set) => ({
  clips: {},

  addClip: (clip) =>
    set((state) => {
      const prev = state.clips[clip.dateKey] ?? [];
      return { clips: { ...state.clips, [clip.dateKey]: [...prev, clip] } };
    }),

  removeClip: (dateKey, id) =>
    set((state) => {
      const filtered = (state.clips[dateKey] ?? []).filter((c) => c.id !== id);
      return { clips: { ...state.clips, [dateKey]: filtered } };
    }),
}));
