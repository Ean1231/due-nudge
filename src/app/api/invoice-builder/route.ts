import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api/require-user";
import { invoiceBuilderSchema, invoiceTotals } from "@/lib/invoice-builder/schema";
import { generateInvoicePdf } from "@/lib/invoice-builder/pdf";
import { readInvoiceLogo } from "@/lib/invoice-builder/assets";
import { deleteInvoicePdf, storeGeneratedInvoicePdf } from "@/lib/invoices/attachment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid invoice submission." }, { status: 400 });
  const payload = form.get("payload");
  let payloadData: unknown = null;
  try {
    payloadData = typeof payload === "string" ? JSON.parse(payload) : null;
  } catch {
    return NextResponse.json({ error: "Invalid invoice submission." }, { status: 400 });
  }
  const parsed = invoiceBuilderSchema.safeParse(payloadData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid invoice details" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const { totalCents } = invoiceTotals(data);
  if (totalCents <= 0) {
    return NextResponse.json({ error: "Invoice total must be greater than zero." }, { status: 400 });
  }

  let attachmentPath: string | null = null;
  let invoiceCreated = false;
  try {
    const logoFile = form.get("logo");
    const logo = logoFile instanceof File && logoFile.size > 0 ? await readInvoiceLogo(logoFile) : undefined;
    const pdf = await generateInvoicePdf(data, logo);
    const attachment = await storeGeneratedInvoicePdf(
      user.id,
      `invoice-${data.invoiceNumber}.pdf`,
      pdf,
    );
    attachmentPath = attachment.path;

    const result = await prisma.$transaction(async (tx) => {
      const normalizedEmail = data.clientEmail.toLowerCase();
      let client = await tx.client.findFirst({
        where: { userId: user.id, email: normalizedEmail },
      });
      if (client) {
        client = await tx.client.update({
          where: { id: client.id },
          data: { name: data.clientName },
        });
      } else {
        client = await tx.client.create({
          data: {
            userId: user.id,
            name: data.clientName,
            email: normalizedEmail,
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { businessName: data.businessName },
      });

      const invoice = await tx.invoice.create({
        data: {
          userId: user.id,
          clientId: client.id,
          number: data.invoiceNumber,
          amountCents: totalCents,
          currency: data.currency,
          description: data.lineItems.map((item) => item.description).join(", ").slice(0, 500),
          dueDate: new Date(`${data.dueDate}T00:00:00Z`),
          status: "unpaid",
          templateId: data.templateId,
          invoiceData: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
          attachmentPath: attachment.path,
          attachmentName: attachment.name,
          attachmentSize: attachment.size,
          attachmentContentType: attachment.contentType,
        },
      });
      return { client, invoice };
    });
    invoiceCreated = true;

    return NextResponse.json(
      {
        invoice: {
          ...result.invoice,
          client: result.client,
          reminders: [],
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (attachmentPath && !invoiceCreated) {
      await deleteInvoicePdf(attachmentPath).catch((cleanupError) => {
        console.error("[DueNudge] Could not clean up generated invoice PDF:", cleanupError);
      });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Invoice number already exists for your account." }, { status: 409 });
    }
    console.error("[DueNudge] Invoice builder failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate invoice." },
      { status: 500 },
    );
  }
}
