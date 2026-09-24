import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { requireSubscribedUser } from "@/lib/session";

type Guard =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

export async function requireApiUser(): Promise<Guard> {
  const { user, reason } = await requireSubscribedUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (reason === "billing") {
    return {
      user: null,
      error: NextResponse.json({ error: "Subscription required" }, { status: 402 }),
    };
  }

  return { user, error: null };
}
