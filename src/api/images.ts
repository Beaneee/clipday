import { Platform } from "react-native";
import { apiRequest } from "./client";

type UploadResponse = { imageUrl: string };

/**
 * 업로드 전 사진을 줄이는 기준.
 * 폰 사진은 4000px대에 10MB를 넘기기도 하는데, 캘린더 썸네일과 모달
 * 미리보기에는 그만한 해상도가 필요 없다. 서버 상한에 걸리면 업로드
 * 자체가 실패하므로 미리 줄여서 보낸다.
 */
const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.85;
/** 해상도가 작아도 이 용량을 넘으면 다시 인코딩해서 줄인다. */
const SHRINK_OVER_BYTES = 4 * 1024 * 1024;

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
 * 사진을 canvas로 다시 그려 크기를 줄인다.
 * 이미 충분히 작으면 원본을 그대로 쓴다.
 */
function drawToBlob(
  source: CanvasImageSource,
  width: number,
  height: number
): Promise<Blob | null> {
  const longestSide = Math.max(width, height);
  const scale = longestSide > MAX_DIMENSION ? MAX_DIMENSION / longestSide : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
}

/**
 * createImageBitmap이 다루지 못하는 형식(HEIC 등)을 위한 폴백.
 * 브라우저가 화면에 그릴 수 있는 형식이면 <img>로는 디코딩된다.
 */
function decodeViaImgTag(blob: Blob): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = async () => {
      const out = await drawToBlob(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * 웹에서 업로드 전에 사진을 줄인다.
 * 해상도가 크거나(MAX_DIMENSION 초과) 용량이 크면(SHRINK_OVER_BYTES 초과)
 * 다시 인코딩한다. 폰 사진은 둘 중 하나에는 대개 걸린다.
 *
 * 줄이지 못하면 원본을 그대로 보낸다 — 줄이기 실패가 업로드를 막을 이유는
 * 없고, 정말 큰 경우엔 서버가 413과 안내 메시지를 내려준다.
 */
async function shrinkForUpload(blob: Blob): Promise<Blob> {
  const oversized = blob.size > SHRINK_OVER_BYTES;

  try {
    const bitmap = await createImageBitmap(blob);
    const tooLarge = Math.max(bitmap.width, bitmap.height) > MAX_DIMENSION;
    if (!tooLarge && !oversized) {
      bitmap.close();
      return blob;
    }
    const shrunk = await drawToBlob(bitmap, bitmap.width, bitmap.height);
    bitmap.close();
    if (shrunk && shrunk.size < blob.size) return shrunk;
  } catch {
    // createImageBitmap이 못 읽는 형식 — <img>로 다시 시도한다.
  }

  const viaImg = await decodeViaImgTag(blob).catch(() => null);
  if (viaImg && viaImg.size < blob.size) return viaImg;

  return blob;
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
