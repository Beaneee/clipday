/** clipday-api의 DailyRecordResponse와 1:1 대응. */
export type DailyRecord = {
  id: number;
  tabId: string;
  date: string; // "YYYY-MM-DD"
  memo: string | null;
  imageUrl: string | null; // "/images/xxx.png" 형태의 서버 상대 경로
  createdAt: string;
  updatedAt: string;
};

export type CreateRecordInput = {
  tabId: string;
  date: string;
  memo?: string | null;
  imageUrl?: string | null;
};

export type UpdateRecordInput = {
  memo?: string | null;
  imageUrl?: string | null;
};
