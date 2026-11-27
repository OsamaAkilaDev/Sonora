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

type Res = { ok: boolean; status: number; json(): Promise<unknown> };
// Distributes over hc's per-status responses; error bodies are thrown, never returned.
type Body<R> = R extends { json(): Promise<infer T> }
  ? T extends { error: unknown }
    ? never
    : T
  : never;

/** Await an hc call: the success body (union of all 2xx shapes), or a thrown ApiError. */
export async function unwrap<R extends Res>(req: Promise<R>): Promise<Body<R>> {
  let res: R;
  try {
    res = await req;
  } catch {
    throw new ApiError(0, "offline", "Can't reach Sonora. Check your connection.");
  }
  if (res.ok) return res.json() as Promise<Body<R>>;
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
  throw new ApiError(
    res.status,
    body?.error.code ?? "http_error",
    body?.error.message ?? "Something went wrong",
    body?.error.fields,
  );
}
