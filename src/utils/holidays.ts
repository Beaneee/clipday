import Holidays from "date-holidays";

/**
 * 공휴일 데이터 소스
 *
 * 1순위: 공공데이터포털 "한국천문연구원 특일 정보" API (getRestDeInfo)
 *        - 대체공휴일·임시공휴일까지 정확. 연 단위(solYear)로 조회.
 *        - 키가 필요: .env 의 EXPO_PUBLIC_KDATA_SERVICE_KEY
 * 2순위(폴백): 아래 검증 표 + date-holidays
 *        - 키가 없거나 네트워크 실패 시 오프라인으로도 동작하게.
 */

const API_BASE =
  "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

/**
 * .env.example을 그대로 복사하면 "your_..._here" 같은 안내 문구가 값으로 들어온다.
 * 이걸 실제 키로 오인하면 매번 실패하는 요청을 보내게 되므로 미설정으로 취급한다.
 */
function readApiKey(): string | null {
  const raw = process.env.EXPO_PUBLIC_KDATA_SERVICE_KEY?.trim();
  if (!raw) return null;
  const looksLikePlaceholder = /^your[_-]/i.test(raw) || /[_-]here$/i.test(raw);
  return looksLikePlaceholder ? null : raw;
}

const API_KEY = readApiKey();

export const hasHolidayApiKey = !!API_KEY;

type ApiItem = {
  locdate: number | string; // 20260101
  dateName: string; // "신정"
  isHoliday?: string; // "Y"
};

/** 공공데이터 API 에서 해당 연도 공휴일 맵을 가져온다. 키 없음/오류 시 throw. */
export async function fetchHolidaysFromApi(
  year: number
): Promise<Record<string, string>> {
  if (!API_KEY) throw new Error("EXPO_PUBLIC_KDATA_SERVICE_KEY 미설정");

  const url =
    `${API_BASE}?serviceKey=${encodeURIComponent(API_KEY)}` +
    `&solYear=${year}&numOfRows=100&_type=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`특일정보 API HTTP ${res.status}`);

  const json = await res.json();
  const resultCode = json?.response?.header?.resultCode;
  if (resultCode && resultCode !== "00") {
    throw new Error(`특일정보 API 오류 ${resultCode}`);
  }

  const items = json?.response?.body?.items;
  const raw = items && items.item ? items.item : [];
  const arr: ApiItem[] = Array.isArray(raw) ? raw : [raw];

  const map: Record<string, string> = {};
  for (const it of arr) {
    if (it.isHoliday && it.isHoliday !== "Y") continue; // 실제 공휴일만
    const s = String(it.locdate); // "20260101"
    const key = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    map[key] = it.dateName;
  }
  return map;
}

// ──────────────────────────────────────────────────────────────
// 폴백: 검증 표 + date-holidays (API 미사용/실패 시)
// ──────────────────────────────────────────────────────────────

const hd = new Holidays("KR");

/**
 * 직접 검증한 대한민국 공휴일 표 (대체공휴일·임시공휴일 포함).
 * date-holidays 는 음력 ±1일 오차, 대체/임시공휴일 누락, 제헌절 오포함 이슈가 있어
 * 아래 표가 있는 연도는 표를 우선 사용한다.
 */
const VERIFIED: Record<number, Record<string, string>> = {
  2025: {
    "2025-01-01": "신정",
    "2025-01-27": "임시공휴일",
    "2025-01-28": "설날",
    "2025-01-29": "설날",
    "2025-01-30": "설날",
    "2025-03-01": "삼일절",
    "2025-03-03": "대체공휴일",
    "2025-05-05": "어린이날·부처님오신날",
    "2025-05-06": "대체공휴일",
    "2025-06-06": "현충일",
    "2025-08-15": "광복절",
    "2025-10-03": "개천절",
    "2025-10-05": "추석",
    "2025-10-06": "추석",
    "2025-10-07": "추석",
    "2025-10-08": "대체공휴일",
    "2025-10-09": "한글날",
    "2025-12-25": "성탄절",
  },
  2026: {
    "2026-01-01": "신정",
    "2026-02-16": "설날",
    "2026-02-17": "설날",
    "2026-02-18": "설날",
    "2026-03-01": "삼일절",
    "2026-03-02": "대체공휴일",
    "2026-05-05": "어린이날",
    "2026-05-24": "부처님오신날",
    "2026-05-25": "대체공휴일",
    "2026-06-06": "현충일",
    "2026-08-15": "광복절",
    "2026-08-17": "대체공휴일",
    "2026-09-24": "추석",
    "2026-09-25": "추석",
    "2026-09-26": "추석",
    "2026-10-03": "개천절",
    "2026-10-05": "대체공휴일",
    "2026-10-09": "한글날",
    "2026-12-25": "성탄절",
  },
  2027: {
    "2027-01-01": "신정",
    "2027-02-06": "설날",
    "2027-02-07": "설날",
    "2027-02-08": "설날",
    "2027-02-09": "대체공휴일",
    "2027-03-01": "삼일절",
    "2027-05-05": "어린이날",
    "2027-05-13": "부처님오신날",
    "2027-06-06": "현충일",
    "2027-09-14": "추석",
    "2027-09-15": "추석",
    "2027-09-16": "추석",
    "2027-10-03": "개천절",
    "2027-10-04": "대체공휴일",
    "2027-10-09": "한글날",
    "2027-10-11": "대체공휴일",
    "2027-12-25": "성탄절",
  },
};

// date-holidays 결과 중 실제 법정공휴일이 아니라 제외할 항목
const EXCLUDE_NAMES = new Set(["제헌절"]);

function buildFromLib(year: number): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of hd.getHolidays(year)) {
    if (h.type !== "public") continue;
    if (EXCLUDE_NAMES.has(h.name)) continue;
    map[h.date.slice(0, 10)] = h.name;
  }
  return map;
}

/** API 없이 사용할 오프라인 폴백 공휴일 맵 */
export function getFallbackHolidays(year: number): Record<string, string> {
  return VERIFIED[year] ?? buildFromLib(year);
}
