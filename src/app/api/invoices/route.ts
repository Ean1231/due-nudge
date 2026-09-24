import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api/require-user";
import { sendImmediateReminder } from "@/lib/invoices/immediate-reminder";
import { deleteInvoicePdf, storeInvoicePdf, type InvoiceAttachment } from "@/lib/invoices/attachment";
import { createInvoiceSchema } from "@/lib/invoices/schema";
import { parseDateInput } from "@/lib/dates";
import { parseAmountToCents } from "@/lib/money";

export async function GET() {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: {
      client: true,
      reminders: { where: { status: "sent" }, orderBy: { milestone: "asc" } },
    },
    orderBy: { dueDate: "asc" },
  });

  invoices.sort((a, b) => {
    if (a.status !== b.status) return a.status === "unpaid" ? -1 : 1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid invoice details" }, { status: 400 });
  const body = {
    clientId: String(form.get("clientId") || ""),
    number: String(form.get("number") || ""),
    amount: String(form.get("amount") || ""),
    currency: String(form.get("currency") || "usd"),
    description: form.get("description") ? String(form.get("description")) : null,
    dueDate: String(form.get("dueDate") || ""),
  };
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice details" }, { status: 400 });
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }

  const dueDate = parseDateInput(parsed.data.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Enter a valid due date" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, userId: user.id },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  let attachment: InvoiceAttachment | null = null;
  let invoiceCreated = false;
  try {
    const file = form.get("attachment");
    if (file instanceof File && file.size > 0) {
      attachment = await storeInvoicePdf(user.id, file);
    }

    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: client.id,
        number: parsed.data.number.trim(),
        amountCents,
        currency: parsed.data.currency.toLowerCase(),
        description: parsed.data.description || null,
        dueDate,
        status: "unpaid",
        attachmentPath: attachment?.path,
        attachmentName: attachment?.name,
        attachmentSize: attachment?.size,
        attachmentContentType: attachment?.contentType,
      },
    });
    invoiceCreated = true;

    const reminder = await sendImmediateReminder(user, client, invoice);
    const withReminders = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { client: true, reminders: true },
    });

    return NextResponse.json({ invoice: withReminders, ...reminder }, { status: 201 });
  } catch (err) {
    if (attachment && !invoiceCreated) {
      await deleteInvoicePdf(attachment.path).catch((cleanupError) => {
        console.error("[DueNudge] Could not clean up invoice PDF:", cleanupError);
      });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Invoice number already exists for your account" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create invoice" },
      { status: 500 },
    );
  }
}
