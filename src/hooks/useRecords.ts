import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { uploadImage } from "@/api/images";
import {
  createRecord,
  deleteRecord,
  deleteRecordsByTab,
  listRecords,
  updateRecord,
} from "@/api/records";
import type { DailyRecord } from "@/types/record";

export const recordKeys = {
  all: ["records"] as const,
  byTab: (tabId: string) => ["records", tabId] as const,
};

/** 저장할 사진의 상태. 서버에 이미 있는 것과 방금 고른 로컬 파일을 구분한다. */
export type PhotoSelection =
  | { kind: "server"; imageUrl: string } // 서버 상대 경로 ("/images/...")
  | {
      // 아직 업로드하지 않은 로컬 파일. picker가 알려준 형식·파일명을 함께
      // 들고 다닌다. 네이티브 업로드는 확장자 추측보다 이 값이 정확하다.
      kind: "local";
      uri: string;
      mimeType?: string | null;
      fileName?: string | null;
    }
  | null;

/**
 * 해당 탭의 기록 목록.
 *
 * 저장된 탭을 다 읽을 때까지 기다렸다 조회하지 않는다. 기다리게 하면
 * 저장소를 못 읽는 환경(시크릿 모드, 저장소 차단 등)에서 요청이 아예
 * 나가지 않아 화면이 로딩에서 멈춘다. 복원 전 기본 탭으로 한 번 더
 * 요청이 나가는 편이 낫다.
 */
export function useRecords(tabId: string) {
  return useQuery({
    queryKey: recordKeys.byTab(tabId),
    queryFn: () => listRecords(tabId),
  });
}

/** 날짜(YYYY-MM-DD) → 기록 맵. 캘린더 셀에서 바로 찾아 쓰기 위한 형태. */
export function useRecordsByDate(tabId: string) {
  const query = useRecords(tabId);

  const byDate = useMemo(() => {
    const map: Record<string, DailyRecord> = {};
    for (const record of query.data ?? []) map[record.date] = record;
    return map;
  }, [query.data]);

  return { ...query, byDate };
}

/** 사진이 로컬 파일이면 업로드하고, 최종적으로 서버에 저장할 imageUrl을 만든다. */
async function resolveImageUrl(photo: PhotoSelection): Promise<string | null> {
  if (!photo) return null;
  if (photo.kind === "server") return photo.imageUrl;
  return uploadImage(photo.uri, {
    mimeType: photo.mimeType,
    fileName: photo.fileName,
  });
}

type SaveInput = {
  dateKey: string;
  memo: string;
  photo: PhotoSelection;
  /** 이미 있는 기록이면 수정, 없으면 생성. */
  existing: DailyRecord | null;
};

/**
 * 기록 저장. 사진 업로드 → 생성/수정까지 한 번에 처리한다.
 * 다른 기기에서 먼저 만들어 409가 나면 수정으로 이어 붙인다.
 */
export function useSaveRecord(tabId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dateKey, memo, photo, existing }: SaveInput) => {
      const imageUrl = await resolveImageUrl(photo);
      const trimmedMemo = memo.trim();

      if (existing) {
        return updateRecord(existing.id, { memo: trimmedMemo, imageUrl });
      }

      try {
        return await createRecord({ tabId, date: dateKey, memo: trimmedMemo, imageUrl });
      } catch (e) {
        if (!(e instanceof ApiError && e.isConflict)) throw e;

        // 이미 같은 날짜 기록이 서버에 있는 경우 — 그 기록을 찾아 수정으로 처리한다.
        const fresh = await listRecords(tabId);
        const conflicting = fresh.find((r) => r.date === dateKey);
        if (!conflicting) throw e;
        return updateRecord(conflicting.id, { memo: trimmedMemo, imageUrl });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recordKeys.byTab(tabId) });
    },
  });
}

/** 기록 한 건 삭제. */
export function useDeleteRecord(tabId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recordKeys.byTab(tabId) });
    },
  });
}

/** 탭을 지울 때 그 탭의 기록을 서버에서도 정리한다. */
export function useDeleteTabRecords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tabId: string) => deleteRecordsByTab(tabId),
    onSuccess: (_data, tabId) => {
      queryClient.removeQueries({ queryKey: recordKeys.byTab(tabId) });
    },
  });
}
