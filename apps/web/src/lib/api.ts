import type { AppType } from "@sonora/api";
import type { ApiErrorBody } from "@sonora/shared";
import { hc } from "hono/client";

/** Typed client for the Worker; same origin, cookie auth. */
export const api = hc<AppType>("/").api;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** Await an hc call and return its JSON, or throw ApiError with the server's code and fields. */
export async function unwrap<T>(req: Promise<{ ok: boolean; status: number; json(): Promise<T> }>) {
  let res: Awaited<typeof req>;
  try {
    res = await req;
  } catch {
    throw new ApiError(0, "offline", "Can't reach Sonora. Check your connection.");
  }
  if (res.ok) return res.json();
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
  throw new ApiError(
    res.status,
    body?.error.code ?? "http_error",
    body?.error.message ?? "Something went wrong",
    body?.error.fields,
  );
}
