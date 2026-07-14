import { create } from "zustand";
import {
  fetchHolidaysFromApi,
  getFallbackHolidays,
  hasHolidayApiKey,
} from "@/utils/holidays";

type YearStatus = "loading" | "loaded" | "error";

type HolidayState = {
  byYear: Record<number, Record<string, string>>; // year → { "YYYY-MM-DD": 공휴일명 }
  status: Record<number, YearStatus>;
  ensureYear: (year: number) => void;
};

export const useHolidayStore = create<HolidayState>((set, get) => ({
  byYear: {},
  status: {},

  ensureYear: (year) => {
    if (get().status[year]) return; // 이미 로딩/완료/실패

    // 폴백 표를 즉시 채워 첫 렌더에서도 공휴일이 보이게 한다.
    set((s) => ({
      byYear: { ...s.byYear, [year]: getFallbackHolidays(year) },
      status: { ...s.status, [year]: "loading" },
    }));

    // 키가 없으면 폴백으로 확정.
    if (!hasHolidayApiKey) {
      set((s) => ({ status: { ...s.status, [year]: "loaded" } }));
      return;
    }

    // API 성공 시 정확한 데이터로 덮어쓰고, 실패 시 폴백을 유지.
    fetchHolidaysFromApi(year)
      .then((map) =>
        set((s) => ({
          byYear: { ...s.byYear, [year]: map },
          status: { ...s.status, [year]: "loaded" },
        }))
      )
      .catch((e) => {
        if (__DEV__) console.warn(`[holidays] ${year} API 실패, 폴백 사용:`, e);
        set((s) => ({ status: { ...s.status, [year]: "error" } }));
      });
  },
}));
