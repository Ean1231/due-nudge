import { randomUUID } from "crypto";
import { del, get, put } from "@vercel/blob";

export const MAX_PDF_BYTES = 3 * 1024 * 1024;

export type InvoiceAttachment = {
  path: string;
  name: string;
  size: number;
  contentType: "application/pdf";
};

export async function storeInvoicePdf(userId: string, file: File): Promise<InvoiceAttachment> {
  const bytes = Buffer.from(await file.arrayBuffer());
  validateInvoicePdf(file.name, file.type, file.size, bytes);
  return storePdfBytes(userId, file.name, bytes);
}

export async function storeGeneratedInvoicePdf(userId: string, filename: string, bytes: Buffer) {
  validateInvoicePdf(filename, "application/pdf", bytes.length, bytes);
  return storePdfBytes(userId, filename, bytes);
}

async function storePdfBytes(userId: string, filename: string, bytes: Buffer): Promise<InvoiceAttachment> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("PDF storage is not configured.");

  const safeName = sanitizeFilename(filename);
  const path = `invoices/${userId}/${randomUUID()}-${safeName}`;
  const blob = await put(path, bytes, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
  });
  return {
    path: blob.pathname,
    name: safeName,
    size: bytes.length,
    contentType: "application/pdf",
  };
}

export function validateInvoicePdf(name: string, contentType: string, size: number, bytes: Buffer) {
  if (size === 0 || size > MAX_PDF_BYTES) {
    throw new Error("Invoice PDF must be smaller than 3 MB.");
  }
  if (contentType !== "application/pdf" || !name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF invoice attachments are allowed.");
  }
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The attachment is not a valid PDF file.");
  }
}

export async function readInvoicePdf(path: string) {
  const result = await get(path, { access: "private" });
  if (!result || result.statusCode !== 200) throw new Error("The invoice PDF could not be found.");
  const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
  if (bytes.length > MAX_PDF_BYTES || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The stored invoice attachment is invalid.");
  }
  return bytes;
}

export async function deleteInvoicePdf(path: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(path);
}

function sanitizeFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120);
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}
