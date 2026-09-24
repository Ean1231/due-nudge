import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api/require-user";
import { sendManualReminder } from "@/lib/invoices/nudge";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: { client: true, reminders: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status !== "unpaid") {
    return NextResponse.json({ error: "Paid invoices are not reminded." }, { status: 400 });
  }

  try {
    const result = await sendManualReminder(user, invoice.client, invoice, invoice.reminders);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: "limit" in result && result.limit ? 402 : 429 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send reminder";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
