import { z } from "zod";

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._]{3,20}$/, "3–20 lowercase letters, numbers, dots or underscores");

export const email = z.email("Enter a valid email address").trim().toLowerCase().max(254);

// Length over composition rules (NIST 800-63B); 128 caps hashing cost.
export const password = z
  .string()
  .min(10, "At least 10 characters")
  .max(128, "At most 128 characters");

export const loginInput = z.object({ email, password: z.string().min(1).max(128) });
export const signupInput = z.object({ email, password, username });

export type LoginInput = z.infer<typeof loginInput>;
export type SignupInput = z.infer<typeof signupInput>;
