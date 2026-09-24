import { randomUUID } from "crypto";
import { del, get, put } from "@vercel/blob";

export const MAX_PDF_BYTES = 3 * 1024 * 1024;
export const MAX_SOURCE_DOCUMENT_BYTES = 3 * 1024 * 1024;

export type InvoiceAttachment = {
  path: string;
  name: string;
  size: number;
  contentType: string;
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

export async function storeSourceDocument(userId: string, file: File): Promise<InvoiceAttachment> {
  const bytes = Buffer.from(await file.arrayBuffer());
  validateSourceDocument(file.name, file.type, file.size, bytes);
  const extension = file.name.toLowerCase().split(".").pop();
  const contentType =
    extension === "pdf"
      ? "application/pdf"
      : extension === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword";
  return storeBytes(userId, file.name, contentType, bytes);
}

async function storePdfBytes(userId: string, filename: string, bytes: Buffer): Promise<InvoiceAttachment> {
  return storeBytes(userId, filename, "application/pdf", bytes);
}

async function storeBytes(
  userId: string,
  filename: string,
  contentType: string,
  bytes: Buffer,
): Promise<InvoiceAttachment> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Invoice file storage is not configured.");

  const safeName = sanitizeFilename(filename);
  const path = `invoices/${userId}/${randomUUID()}-${safeName}`;
  const blob = await put(path, bytes, {
    access: "private",
    contentType,
    addRandomSuffix: false,
  });
  return {
    path: blob.pathname,
    name: safeName,
    size: bytes.length,
    contentType,
  };
}

export function validateSourceDocument(name: string, contentType: string, size: number, bytes: Buffer) {
  if (size === 0 || size > MAX_SOURCE_DOCUMENT_BYTES) {
    throw new Error("Original invoice file must be smaller than 3 MB.");
  }
  const extension = name.toLowerCase().split(".").pop();
  const genericType = !contentType || contentType === "application/octet-stream";
  const isPdf = extension === "pdf" && (genericType || contentType === "application/pdf") && bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  const isDocx =
    extension === "docx" &&
    (genericType || contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") &&
    bytes.subarray(0, 2).toString("ascii") === "PK";
  const isDoc =
    extension === "doc" &&
    (genericType || contentType === "application/msword") &&
    bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (!isPdf && !isDocx && !isDoc) {
    throw new Error("Original invoice must be a valid PDF, DOC, or DOCX file.");
  }
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
  const bytes = await readStoredAttachment(path);
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The stored invoice attachment is invalid.");
  }
  return bytes;
}

export async function readStoredAttachment(path: string) {
  const result = await get(path, { access: "private" });
  if (!result || result.statusCode !== 200) throw new Error("The invoice attachment could not be found.");
  const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
  if (bytes.length > MAX_SOURCE_DOCUMENT_BYTES) {
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
  return cleaned || "invoice-file";
}
