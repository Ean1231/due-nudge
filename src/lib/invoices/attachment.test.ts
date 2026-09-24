import { describe, expect, it } from "vitest";
import { MAX_PDF_BYTES, validateInvoicePdf } from "@/lib/invoices/attachment";

describe("invoice PDF validation", () => {
  it("accepts a PDF with the correct signature", () => {
    expect(() =>
      validateInvoicePdf("invoice.pdf", "application/pdf", 10, Buffer.from("%PDF-1.7\n")),
    ).not.toThrow();
  });

  it("rejects renamed non-PDF content", () => {
    expect(() =>
      validateInvoicePdf("invoice.pdf", "application/pdf", 10, Buffer.from("<html>")),
    ).toThrow("not a valid PDF");
  });

  it("rejects oversized files", () => {
    expect(() =>
      validateInvoicePdf(
        "invoice.pdf",
        "application/pdf",
        MAX_PDF_BYTES + 1,
        Buffer.from("%PDF-"),
      ),
    ).toThrow("smaller than 3 MB");
  });
});
