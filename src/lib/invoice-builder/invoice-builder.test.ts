import { describe, expect, it } from "vitest";
import { generateInvoicePdf } from "@/lib/invoice-builder/pdf";
import {
  INVOICE_TEMPLATE_IDS,
  invoiceBuilderSchema,
  invoiceTotals,
  type InvoiceBuilderInput,
} from "@/lib/invoice-builder/schema";

const base: InvoiceBuilderInput = {
  templateId: "classic",
  businessName: "Due Studio",
  businessEmail: "owner@example.com",
  businessPhone: "+1 555 1000",
  businessAddress: "10 Main Street\nCape Town",
  clientName: "Example Client",
  clientEmail: "client@example.com",
  clientPhone: "+1 555 2000",
  clientAddress: "20 Client Road\nJohannesburg",
  invoiceNumber: "INV-1001",
  issueDate: "2026-09-24",
  dueDate: "2026-10-08",
  currency: "usd",
  taxRate: 10,
  notes: "Thank you.",
  paymentTerms: "Payment within 14 days.",
  signatureName: "J. Smith",
  lineItems: [{ description: "Design work", quantity: 2, unitPrice: 100 }],
};

describe("invoice builder", () => {
  it("calculates subtotal, tax, and total in cents", () => {
    expect(invoiceTotals(base)).toEqual({
      subtotalCents: 20000,
      taxCents: 2000,
      totalCents: 22000,
    });
  });

  it("rejects a due date before the issue date", () => {
    const parsed = invoiceBuilderSchema.safeParse({ ...base, dueDate: "2026-09-01" });
    expect(parsed.success).toBe(false);
  });

  it.each(INVOICE_TEMPLATE_IDS)("generates a valid %s PDF", async (templateId) => {
    const pdf = await generateInvoicePdf({ ...base, templateId });
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
