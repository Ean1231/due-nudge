import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api/require-user";
import { readInvoicePdf } from "@/lib/invoices/attachment";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    select: { attachmentPath: true, attachmentName: true },
  });
  if (!invoice?.attachmentPath || !invoice.attachmentName) {
    return NextResponse.json({ error: "Invoice attachment not found" }, { status: 404 });
  }

  try {
    const bytes = await readInvoicePdf(invoice.attachmentPath);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.attachmentName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not download invoice PDF" },
      { status: 502 },
    );
  }
}
