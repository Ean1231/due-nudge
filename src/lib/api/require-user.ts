import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { getAppUser } from "@/lib/session";

type Guard =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

export async function requireApiUser(): Promise<Guard> {
  const user = await getAppUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, error: null };
}
