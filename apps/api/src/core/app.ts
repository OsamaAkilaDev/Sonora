import { createMiddleware } from "hono/factory";
import type { User } from "../db/schema";
import { createDb, type Db } from "./db";

export type AppEnv = {
  Bindings: Env;
  Variables: { db: Db; user: User; sessionId: string };
};

export const withDb = createMiddleware<AppEnv>(async (c, next) => {
  c.set("db", createDb(c.env.DB));
  await next();
});
