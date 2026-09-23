import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSubscribedUser } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  company: z.string().max(120).optional().nullable(),
});

export async function GET() {
  const { user, reason } = await requireSubscribedUser();
  if (reason === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (reason === "billing") {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const clients = await prisma.client.findMany({
    where: { userId: user!.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ clients });
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
    return NextResponse.json({ error: "Invalid client details" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      userId: user!.id,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      company: parsed.data.company || null,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
