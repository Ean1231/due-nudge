import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseAmountToCents } from "@/lib/money";
import { requireSubscribedUser } from "@/lib/session";

const schema = z.object({
  clientId: z.string().min(1),
  number: z.string().min(1).max(64),
  amount: z.string().min(1),
  currency: z.string().length(3).default("usd"),
  description: z.string().max(500).optional().nullable(),
  dueDate: z.string().min(1),
});

export async function GET() {
  const { user, reason } = await requireSubscribedUser();
  if (reason === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (reason === "billing") {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: user!.id },
    include: {
      client: true,
      reminders: { orderBy: { milestone: "asc" } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const { user, reason } = await requireSubscribedUser();
  if (reason === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (reason === "billing") {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice details" }, { status: 400 });
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }

  const dueDate = new Date(parsed.data.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Enter a valid due date" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, userId: user!.id },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  try {
    const invoice = await prisma.invoice.create({
      data: {
        userId: user!.id,
        clientId: client.id,
        number: parsed.data.number.trim(),
        amountCents,
        currency: parsed.data.currency.toLowerCase(),
        description: parsed.data.description || null,
        dueDate,
        status: "unpaid",
      },
      include: { client: true, reminders: true },
    });
    return NextResponse.json({ invoice }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invoice number already exists for your account" },
      { status: 409 },
    );
  }
}
