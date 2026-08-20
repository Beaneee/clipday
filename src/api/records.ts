import { apiRequest } from "./client";
import type { CreateRecordInput, DailyRecord, UpdateRecordInput } from "@/types/record";

const BASE = "/api/records";

/** 해당 탭의 기록 전체 조회. */
export function listRecords(tabId: string) {
  return apiRequest<DailyRecord[]>(`${BASE}?tabId=${encodeURIComponent(tabId)}`);
}

/** 단건 조회. 없으면 ApiError(404). */
export function getRecord(id: number) {
  return apiRequest<DailyRecord>(`${BASE}/${id}`);
}

/** 기록 생성. 같은 탭에 같은 날짜가 이미 있으면 ApiError(409). */
export function createRecord(input: CreateRecordInput) {
  return apiRequest<DailyRecord>(BASE, { method: "POST", body: input });
}

/** 기록 수정 (memo, imageUrl만 변경 가능). */
export function updateRecord(id: number, input: UpdateRecordInput) {
  return apiRequest<DailyRecord>(`${BASE}/${id}`, { method: "PUT", body: input });
}

/** 기록 삭제. */
export function deleteRecord(id: number) {
  return apiRequest<null>(`${BASE}/${id}`, { method: "DELETE" });
}

/** 탭 삭제 시 해당 탭의 기록을 서버에서도 모두 제거. */
export function deleteRecordsByTab(tabId: string) {
  return apiRequest<null>(`${BASE}?tabId=${encodeURIComponent(tabId)}`, { method: "DELETE" });
}
