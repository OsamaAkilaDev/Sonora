import type { ApiErrorBody } from "@sonora/shared";
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Throw from anywhere in a request; the handler turns it into an ApiErrorBody. */
export class AppError extends HTTPException {
  constructor(
    status: ContentfulStatusCode,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(status, { message });
  }
}

export const onError: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message, fields: err.fields },
    };
    return c.json(body, err.status);
  }
  if (err instanceof HTTPException) {
    return c.json({ error: { code: "http_error", message: err.message } }, err.status);
  }
  console.error(err);
  return c.json({ error: { code: "internal", message: "Something went wrong" } }, 500);
};
