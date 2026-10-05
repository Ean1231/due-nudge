import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createEmailVerificationToken, sendVerificationEmail } from "@/lib/security/email-verification";
import { hashPassword, newPasswordSchema } from "@/lib/security/passwords";
import { clientIp, enforceRateLimit } from "@/lib/security/rate-limit";

const safeText = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine((value) => !/[\u0000-\u001F]/.test(value), "Invalid characters.");

const schema = z.object({
  name: safeText,
  businessName: safeText,
  email: z.string().trim().email().max(254),
  password: newPasswordSchema,
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid registration details" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const verification = createEmailVerificationToken();
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      businessName: parsed.data.businessName,
      email,
      passwordHash,
      role: "user",
      subscriptionStatus: "none",
      emailVerificationTokenHash: verification.hash,
      emailVerificationExpires: verification.expires,
    },
    select: { id: true, email: true },
  });

  try {
    const sent = await sendVerificationEmail(email, verification.token);
    if (!sent.delivered && process.env.NODE_ENV !== "production") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationTokenHash: null,
          emailVerificationExpires: null,
        },
      });
      return NextResponse.json({ ok: true, verificationRequired: false }, { status: 201 });
    }
  } catch (err) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    console.error("[DueNudge] Verification email failed");
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send the verification email." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, verificationRequired: true }, { status: 201 });
}
