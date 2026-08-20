import { Platform } from "react-native";
import { apiRequest } from "./client";

type UploadResponse = { imageUrl: string };

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  bmp: "image/bmp",
};

/** uri 끝의 확장자로 MIME 타입을 추론한다. 서버가 image/* 만 허용하므로 기본값도 이미지. */
function guessMimeType(uri: string): string {
  const ext = uri.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase();
  return (ext && MIME_BY_EXTENSION[ext]) || "image/jpeg";
}

function guessFileName(uri: string, mimeType: string): string {
  const last = uri.split("?")[0].split("#")[0].split("/").pop() ?? "";
  if (last && last.includes(".")) return last;
  const ext = mimeType.split("/")[1] ?? "jpg";
  return `clip-${Date.now()}.${ext}`;
}

/**
 * 로컬 이미지 uri를 서버에 업로드하고 서버 경로("/images/xxx.png")를 돌려준다.
 * 웹에서는 Blob으로, 네이티브에서는 RN FormData 파일 객체로 보낸다.
 */
export async function uploadImage(localUri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // 웹의 picker는 blob:/data: uri를 준다. 실제 바이트를 읽어 Blob으로 올린다.
    const blob = await (await fetch(localUri)).blob();
    const mimeType = blob.type || guessMimeType(localUri);
    formData.append("file", blob, guessFileName(localUri, mimeType));
  } else {
    const mimeType = guessMimeType(localUri);
    formData.append("file", {
      uri: localUri,
      name: guessFileName(localUri, mimeType),
      type: mimeType,
    } as unknown as Blob);
  }

  const res = await apiRequest<UploadResponse>("/api/images", {
    method: "POST",
    rawBody: formData,
    timeoutMs: 60000, // 이미지 업로드는 여유 있게
  });

  return res.imageUrl;
}

/** 이미 서버에 올라간 경로("/images/...")인지 판별. 재업로드를 피하는 데 쓴다. */
export function isUploadedImageUrl(uri: string | null | undefined): boolean {
  return !!uri && uri.startsWith("/images/");
}
