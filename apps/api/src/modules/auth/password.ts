import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  pw: string,
  salt: Buffer,
  len: number,
  opts: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// OWASP scrypt profile (N=2^15, r=8, p=3: ~32 MiB). Native in workerd, unlike WebCrypto PBKDF2
// which production Workers cap at 100k iterations. Params live in the hash so they can be raised.
const PARAMS = { N: 2 ** 15, r: 8, p: 3 };
const KEY_LEN = 32;
const maxmem = (N: number, r: number) => 256 * N * r;

/** Format: scrypt$N$r$p$saltB64$hashB64 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p } = PARAMS;
  const key = await scrypt(password, salt, KEY_LEN, { N, r, p, maxmem: maxmem(N, r) });
  return ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const N = Number(n);
  const R = Number(r);
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(password, Buffer.from(salt, "base64"), expected.length, {
    N,
    r: R,
    p: Number(p),
    maxmem: maxmem(N, R),
  });
  return timingSafeEqual(key, expected);
}

/** Verified against when the email is unknown, so timing doesn't reveal which emails exist. */
let dummy: Promise<string> | undefined;
export const dummyHash = () => {
  dummy ??= hashPassword("sonora-dummy-password");
  return dummy;
};
