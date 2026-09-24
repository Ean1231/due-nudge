import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api/require-user";
import { readStoredAttachment } from "@/lib/invoices/attachment";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    select: {
      sourceDocumentPath: true,
      sourceDocumentName: true,
      sourceDocumentContentType: true,
    },
  });
  if (!invoice?.sourceDocumentPath || !invoice.sourceDocumentName) {
    return NextResponse.json({ error: "Original invoice file not found" }, { status: 404 });
  }
  try {
    const bytes = await readStoredAttachment(invoice.sourceDocumentPath);
    return new Response(bytes, {
      headers: {
        "Content-Type": invoice.sourceDocumentContentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${invoice.sourceDocumentName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not download original invoice file" },
      { status: 502 },
    );
  }
}
