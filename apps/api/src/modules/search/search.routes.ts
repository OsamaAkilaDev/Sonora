import { zValidator } from "@hono/zod-validator";
import { searchQuery } from "@sonora/shared";
import { Hono } from "hono";
import type { AppEnv } from "../../core/app";
import { AppError } from "../../core/errors";
import { requireAuth } from "../auth/session";
import { searchMessages } from "./search.service";

export const searchRoutes = new Hono<AppEnv>().use(requireAuth).get(
  "/",
  zValidator("query", searchQuery, (r) => {
    if (!r.success) throw new AppError(422, "invalid_input", "Search for at least 2 characters");
  }),
  async (c) =>
    c.json({ results: await searchMessages(c.var.db, c.var.user.id, c.req.valid("query").q) }),
);
