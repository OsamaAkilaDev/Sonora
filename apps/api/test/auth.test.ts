import { SELF } from "cloudflare:test";
import { expect, it } from "vitest";

const ORIGIN = "https://sonora.test";
const call = (path: string, init: RequestInit & { cookie?: string } = {}) =>
  SELF.fetch(`${ORIGIN}/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      ...(init.cookie ? { cookie: init.cookie } : {}),
      ...init.headers,
    },
  });
const cookieOf = (res: Response) => res.headers.get("set-cookie")?.split(";")[0] ?? "";

const omar = {
  email: "Omar@Example.com",
  password: "correct-horse-battery",
  username: "omar",
};

it("signup → session → logout lifecycle, with safe failure modes", async () => {
  const signup = await call("/auth/signup", { method: "POST", body: JSON.stringify(omar) });
  expect(signup.status).toBe(201);
  const cookie = cookieOf(signup);
  expect(signup.headers.get("set-cookie")).toMatch(/__Host-sid=.+HttpOnly.+Secure.+SameSite=Lax/i);

  const me = await call("/auth/me", { cookie });
  expect((await me.json<{ user: { email: string } }>()).user.email).toBe("omar@example.com");

  // Duplicate email and username are reported per field.
  const dup = await call("/auth/signup", { method: "POST", body: JSON.stringify(omar) });
  expect(dup.status).toBe(409);
  expect((await dup.json<{ error: { fields: object } }>()).error.fields).toHaveProperty("username");

  // Wrong password and unknown email are indistinguishable.
  const wrongPw = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: omar.email, password: "nope-nope-nope" }),
  });
  const noUser = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "ghost@example.com", password: "nope-nope-nope" }),
  });
  expect([wrongPw.status, noUser.status]).toEqual([401, 401]);
  expect(await wrongPw.json()).toEqual(await noUser.json());

  // Cross-origin mutation is refused even with a valid cookie.
  const csrf = await call("/auth/logout", {
    method: "POST",
    cookie,
    headers: { origin: "https://evil.test" },
  });
  expect(csrf.status).toBe(403);

  expect((await call("/auth/logout", { method: "POST", cookie })).status).toBe(200);
  expect((await call("/auth/me", { cookie })).status).toBe(401);
});
