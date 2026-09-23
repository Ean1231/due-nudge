import { NextResponse } from "next/server";
import { processDueReminders } from "@/lib/reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  const authorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && querySecret === cronSecret) ||
    (!cronSecret && process.env.NODE_ENV !== "production");

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueReminders();
  return NextResponse.json({ ok: true, ...result });
}
