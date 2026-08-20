/**
 * clipday-api (Spring Boot) 통신 공통 레이어.
 * 서버 스펙: https://github.com/Beaneee/clipday-api
 */

/**
 * 기본값에 localhost 대신 127.0.0.1을 쓴다.
 * 브라우저는 localhost를 IPv6(::1)로 먼저 해석하는데 Spring Boot는 IPv4로만
 * 리슨해서, curl은 되지만 웹에서만 연결이 실패하는 일이 생긴다.
 * (실기기·Android 에뮬레이터에서는 .env에 개발 PC의 LAN IP를 넣어야 한다.)
 */
const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

/** 끝의 슬래시를 제거한 API 베이스 URL. */
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

const DEFAULT_TIMEOUT_MS = 15000;

/** 서버가 내려주는 에러 본문 (ErrorResponse.java). */
type ServerErrorBody = {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ServerErrorBody | null;

  constructor(status: number, message: string, body: ServerErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** 날짜 중복(409) — 이미 그 날짜에 기록이 있다는 뜻. */
  get isConflict() {
    return this.status === 409;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

/** 네트워크 자체가 닿지 않은 경우(서버 미기동, 오프라인 등). */
export class NetworkError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "NetworkError";
  }
}

async function parseErrorBody(res: Response): Promise<ServerErrorBody | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as ServerErrorBody;
  } catch {
    return null;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** FormData 등 직렬화 없이 그대로 보낼 본문. */
  rawBody?: BodyInit;
  timeoutMs?: number;
};

/**
 * API 요청 한 번. 실패 시 ApiError / NetworkError를 던진다.
 * 204 No Content는 null을 돌려준다.
 */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body, rawBody, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { Accept: "application/json" };
  // FormData는 boundary가 필요하므로 Content-Type을 직접 지정하지 않는다.
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    throw new NetworkError(
      aborted
        ? `요청이 ${timeoutMs}ms 안에 끝나지 않았습니다. (${path})`
        : `서버에 연결할 수 없습니다. API 주소를 확인해주세요. (${API_BASE_URL})`,
      e
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errorBody = await parseErrorBody(res);
    throw new ApiError(
      res.status,
      errorBody?.message ?? `요청이 실패했습니다. (HTTP ${res.status})`,
      errorBody
    );
  }

  if (res.status === 204) return null as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/**
 * 서버가 돌려주는 "/images/xxx.png" 상대 경로를 화면에서 바로 쓸 수 있는
 * 절대 URL로 바꾼다. 이미 절대 URL이거나 로컬 uri면 그대로 둔다.
 */
export function toAbsoluteImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^[a-z]+:/i.test(imageUrl)) return imageUrl; // http:, https:, file:, data:, blob:
  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}
