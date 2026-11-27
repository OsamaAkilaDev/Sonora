import { zValidator } from "@hono/zod-validator";
import type { z } from "zod";
import { AppError } from "./errors";

/** zValidator that fails with our 422 shape: { error: { code, message, fields } }. */
export const body = <T extends z.ZodType>(schema: T) =>
  zValidator("json", schema, (result) => {
    if (result.success) return;
    const fields = Object.fromEntries(
      result.error.issues.map((i) => [i.path.join("."), i.message]),
    );
    throw new AppError(422, "invalid_input", "Check the highlighted fields", fields);
  });
