import { env } from "cloudflare:test";
import { expect, it } from "vitest";
import { createDb } from "../src/core/db";
import { login, signup } from "../src/modules/auth/auth.service";
import { hashPassword, needsRehash, verifyPassword } from "../src/modules/auth/password";

it("free-plan hashes verify, and upgrade to the strong profile on the next login", async () => {
  const free = await hashPassword("correct-horse-battery", "free");
  expect(await verifyPassword("correct-horse-battery", free)).toBe(true);
  expect(await verifyPassword("wrong-horse-battery", free)).toBe(false);
  expect(needsRehash(free, "free")).toBe(false);
  expect(needsRehash(free, "owasp")).toBe(true);

  const db = createDb(env.DB);
  const input = { email: "karim@example.com", password: "correct-horse-battery" };
  await signup(db, { ...input, username: "karim" }, "free");

  // Plan upgraded: the first login rehashes to owasp params, later logins leave it alone.
  const upgraded = await login(db, input, "owasp");
  expect(upgraded.passwordHash).toMatch(/^scrypt\$32768\$8\$3\$/);
  const again = await login(db, input, "owasp");
  expect(again.passwordHash).toBe(upgraded.passwordHash);
  await expect(login(db, { ...input, password: "nope-nope-nope" }, "owasp")).rejects.toThrow();
});
