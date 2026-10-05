import { notFound } from "next/navigation";
import type { User } from "@prisma/client";

export function isAdmin(user: Pick<User, "role">) {
  return user.role === "admin";
}

export function requireAdmin(user: Pick<User, "role"> | null) {
  if (!user || !isAdmin(user)) notFound();
}
