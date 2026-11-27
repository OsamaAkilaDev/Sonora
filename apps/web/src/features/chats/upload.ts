import { type Attachment, MAX_UPLOAD_BYTES, uploadAllowed } from "@sonora/shared";
import { ApiError } from "../../lib/api";

/** Client-side check before spending bandwidth; the server enforces the same rules. */
export function checkFile(file: File): string | null {
  if (!uploadAllowed(file.type)) return `${file.name} isn't a type Sonora can send`;
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name} is over 25 MB`;
  return null;
}

async function imageSize(file: File) {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  } catch {
    return null; // undecodable (e.g. HEIC on some browsers): no reserved size, still sends
  }
}

/**
 * Streams the raw file to the Worker. XHR rather than fetch: it reports upload progress.
 * Resolves with the stored attachment (not yet attached to a message).
 */
export async function uploadFile(
  chatId: string,
  file: File,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<Attachment> {
  const size = await imageSize(file);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/chats/${chatId}/uploads`);
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    if (size) {
      xhr.setRequestHeader("x-width", String(size.width));
      xhr.setRequestHeader("x-height", String(size.height));
    }
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      const body = JSON.parse(xhr.responseText || "null");
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body.attachment);
      reject(
        new ApiError(
          xhr.status,
          body?.error?.code ?? "upload_failed",
          body?.error?.message ?? "Upload failed",
        ),
      );
    };
    xhr.onerror = () =>
      reject(new ApiError(0, "offline", "Can't reach Sonora. Check your connection."));
    xhr.onabort = () => reject(new ApiError(0, "aborted", "Upload cancelled"));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
}

export const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 ** 2
      ? `${(n / 1024).toFixed(0)} KB`
      : `${(n / 1024 ** 2).toFixed(1)} MB`;
