import type { LoginInput, Me, SignupInput } from "@sonora/shared";
import { eq, or } from "drizzle-orm";
import { ulid } from "ulid";
import type { Db } from "../../core/db";
import { AppError } from "../../core/errors";
import { type User, users } from "../../db/schema";
import { dummyHash, hashPassword, needsRehash, type Profile, verifyPassword } from "./password";

export const toMe = (u: User): Me => ({
  id: u.id,
  email: u.email,
  username: u.username,
  avatarSeed: u.avatarSeed,
  about: u.about,
  status: u.status,
  createdAt: u.createdAt.getTime(),
});

export async function signup(db: Db, input: SignupInput, profile: Profile): Promise<User> {
  const taken = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(or(eq(users.email, input.email), eq(users.username, input.username)))
    .all();
  const fields: Record<string, string> = {};
  if (taken.some((t) => t.email === input.email))
    fields.email = "An account already uses this email";
  if (taken.some((t) => t.username === input.username)) fields.username = "That username is taken";
  if (Object.keys(fields).length) throw new AppError(409, "taken", "Already in use", fields);

  const user: User = {
    id: ulid(),
    email: input.email,
    username: input.username,
    passwordHash: await hashPassword(input.password, profile),
    avatarSeed: crypto.randomUUID().slice(0, 8),
    about: "",
    status: "online",
    connected: false,
    lastSeenAt: null,
    createdAt: new Date(),
  };
  try {
    await db.insert(users).values(user);
  } catch (e) {
    // Lost a race with a concurrent signup on the unique indexes.
    if (String(e).includes("UNIQUE")) throw new AppError(409, "taken", "Already in use");
    throw e;
  }
  return user;
}

export async function login(db: Db, input: LoginInput, profile: Profile): Promise<User> {
  const user = await db.select().from(users).where(eq(users.email, input.email)).get();
  const ok = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash(profile)));
  if (!user || !ok)
    throw new AppError(401, "invalid_credentials", "Email or password is incorrect");
  // Stored with weaker params than configured (e.g. after moving to "owasp"): upgrade now.
  if (needsRehash(user.passwordHash, profile)) {
    const passwordHash = await hashPassword(input.password, profile);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    return { ...user, passwordHash };
  }
  return user;
}
