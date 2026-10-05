import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export function createEmailVerificationToken() {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashEmailVerificationToken(token),
    expires: new Date(Date.now() + DAY_MS),
  };
}

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!appUrl || !apiKey || !from) {
    if (process.env.NODE_ENV !== "production") return { delivered: false as const };
    throw new Error("Email verification is not configured.");
  }

  const link = `${appUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Confirm your DueNudge email",
      text: `Confirm your email address by opening this link:\n${link}\n\nThis link expires in 24 hours. If you did not create an account, you can ignore this message.`,
    }),
  });
  if (!response.ok) {
    throw new Error("Could not send the verification email.");
  }
  return { delivered: true as const };
}

export async function verifyEmailToken(token: string | undefined) {
  if (!token || token.length < 20 || token.length > 200) return false;
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: hashEmailVerificationToken(token),
      emailVerificationExpires: { gt: new Date() },
    },
    select: { id: true },
  });
  if (!user) return false;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
    },
  });
  return true;
}
