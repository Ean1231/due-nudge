import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSubscribedUser } from "@/lib/session";

const patchSchema = z.object({
  status: z.enum(["paid", "unpaid"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { user, reason } = await requireSubscribedUser();
  if (reason === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (reason === "billing") {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, userId: user!.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      status: parsed.data.status,
      paidAt: parsed.data.status === "paid" ? new Date() : null,
    },
    include: { client: true, reminders: true },
  });

  return NextResponse.json({ invoice });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { user, reason } = await requireSubscribedUser();
  if (reason === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (reason === "billing") {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({
    where: { id, userId: user!.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
