import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api/require-user";
import {
  DEFAULT_REMINDER_BODY,
  DEFAULT_REMINDER_SUBJECT,
  reminderTemplateSchema,
} from "@/lib/email/custom-template";

export async function GET() {
  const { user, error } = await requireApiUser();
  if (error) return error;
  return NextResponse.json({
    subject: user.reminderSubject || DEFAULT_REMINDER_SUBJECT,
    body: user.reminderBody || DEFAULT_REMINDER_BODY,
    customized: Boolean(user.reminderSubject && user.reminderBody),
  });
}

export async function PUT(request: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  const parsed = reminderTemplateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid reminder template" },
      { status: 400 },
    );
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      reminderSubject: parsed.data.subject,
      reminderBody: parsed.data.body,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { user, error } = await requireApiUser();
  if (error) return error;
  await prisma.user.update({
    where: { id: user.id },
    data: { reminderSubject: null, reminderBody: null },
  });
  return NextResponse.json({
    ok: true,
    subject: DEFAULT_REMINDER_SUBJECT,
    body: DEFAULT_REMINDER_BODY,
  });
}
