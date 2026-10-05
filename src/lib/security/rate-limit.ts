import { prisma } from "@/lib/db";

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return ip.replace(/[^\w.:-]/g, "").slice(0, 64) || "unknown";
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!bucket || bucket.resetAt <= now) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return { ok: true as const };
  }

  if (bucket.count >= limit) {
    return { ok: false as const, retryAt: bucket.resetAt };
  }

  await prisma.rateLimitBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { ok: true as const };
}
