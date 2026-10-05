import bcrypt from "bcryptjs";
import { z } from "zod";

export const BCRYPT_ROUNDS = 12;

export const newPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Password is too long.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
