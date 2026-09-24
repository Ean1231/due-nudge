import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api/require-user";
import { sendManualReminder } from "@/lib/invoices/nudge";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
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
    const body = await request.json().catch(() => ({}));
    const retryUnknown = body && typeof body === "object" && body.retryUnknown === true;
    const result = await sendManualReminder(user, invoice.client, invoice, invoice.reminders, retryUnknown);
    if (!result.ok) {
      const code = "code" in result ? result.code : "rate_limit";
      const status =
        code === "gmail" || code === "unknown"
          ? 409
          : code === "limit"
            ? 402
            : code === "failed"
              ? 502
              : 429;
      return NextResponse.json({ error: result.error, code }, { status });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send reminder";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
