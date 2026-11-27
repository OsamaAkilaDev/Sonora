import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  pw: string,
  salt: Buffer,
  len: number,
  opts: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * scrypt profiles (native in workerd; WebCrypto PBKDF2 is capped at 100k iterations in production).
 * - owasp: OWASP's N=2^15, r=8, p=3 (~32 MiB). Needs Workers Paid CPU headroom.
 * - free:  N=2^12, r=8, p=1 (~4 MiB), sized for the free plan's 10 ms CPU budget. Weaker.
 * Params are stored in each hash, and logins rehash to the configured profile, so switching
 * PASSWORD_PROFILE to "owasp" upgrades every account on its next sign-in.
 */
export const PROFILES = {
  free: { N: 2 ** 12, r: 8, p: 1 },
  owasp: { N: 2 ** 15, r: 8, p: 3 },
} as const;
export type Profile = keyof typeof PROFILES;

const KEY_LEN = 32;
const maxmem = (N: number, r: number) => 256 * N * r;
const cost = (N: number, r: number, p: number) => N * r * p;

/** Format: scrypt$N$r$p$saltB64$hashB64 */
export async function hashPassword(password: string, profile: Profile): Promise<string> {
  const { N, r, p } = PROFILES[profile];
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LEN, { N, r, p, maxmem: maxmem(N, r) });
  return ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

const parse = (stored: string) => {
  const [alg, n, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return null;
  return { N: Number(n), r: Number(r), p: Number(p), salt, hash };
};

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const h = parse(stored);
  if (!h) return false;
  const expected = Buffer.from(h.hash, "base64");
  const key = await scrypt(password, Buffer.from(h.salt, "base64"), expected.length, {
    N: h.N,
    r: h.r,
    p: h.p,
    maxmem: maxmem(h.N, h.r),
  });
  return timingSafeEqual(key, expected);
}

/** True when a stored hash is weaker than the configured profile (rehash it after a good login). */
export function needsRehash(stored: string, profile: Profile) {
  const h = parse(stored);
  const want = PROFILES[profile];
  return !h || cost(h.N, h.r, h.p) < cost(want.N, want.r, want.p);
}

/** Verified against when the email is unknown, so timing doesn't reveal which emails exist. */
const dummies = new Map<Profile, Promise<string>>();
export function dummyHash(profile: Profile) {
  const cached = dummies.get(profile);
  if (cached) return cached;
  const d = hashPassword("sonora-dummy-password", profile);
  dummies.set(profile, d);
  return d;
}
