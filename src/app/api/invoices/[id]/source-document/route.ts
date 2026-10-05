import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api/require-user";
import { readStoredAttachment } from "@/lib/invoices/attachment";
import { isOwnedStoragePath, safeDownloadName } from "@/lib/security/storage-path";

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
  if (
    !invoice?.sourceDocumentPath ||
    !invoice.sourceDocumentName ||
    !isOwnedStoragePath(user.id, invoice.sourceDocumentPath)
  ) {
    return NextResponse.json({ error: "Original invoice file not found" }, { status: 404 });
  }
  try {
    const bytes = await readStoredAttachment(invoice.sourceDocumentPath, user.id);
    return new Response(bytes, {
      headers: {
        "Content-Type": invoice.sourceDocumentContentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeDownloadName(invoice.sourceDocumentName)}"`,
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
