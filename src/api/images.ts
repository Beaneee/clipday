import { Platform } from "react-native";
import { apiRequest } from "./client";

type UploadResponse = { imageUrl: string };

/**
 * 업로드 전 사진을 줄이는 기준.
 * 폰 사진은 4000px대에 10MB를 넘기기도 하는데, 캘린더 썸네일과 모달
 * 미리보기에는 그만한 해상도가 필요 없다. 서버 상한(10MB)에 걸리면
 * 업로드 자체가 실패하므로 미리 줄여서 보낸다.
 */
const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.85;

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
 * 웹에서 긴 변이 MAX_DIMENSION을 넘으면 canvas로 줄인다.
 * 실패하면 원본을 그대로 돌려준다 — 줄이지 못했다고 업로드까지 막을 이유는 없고,
 * 정말 큰 경우에는 서버가 413과 함께 안내 메시지를 내려준다.
 */
async function shrinkForUpload(blob: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob);
    const longestSide = Math.max(bitmap.width, bitmap.height);
    if (longestSide <= MAX_DIMENSION) {
      bitmap.close();
      return blob;
    }

    const scale = MAX_DIMENSION / longestSide;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const shrunk = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    return shrunk ?? blob;
  } catch {
    return blob;
  }
}

/**
 * 로컬 이미지 uri를 서버에 업로드하고 서버 경로("/images/xxx.png")를 돌려준다.
 * 웹에서는 Blob으로, 네이티브에서는 RN FormData 파일 객체로 보낸다.
 */
export async function uploadImage(localUri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // 웹의 picker는 blob:/data: uri를 준다. 실제 바이트를 읽어 Blob으로 올린다.
    const original = await (await fetch(localUri)).blob();
    const blob = await shrinkForUpload(original);
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
