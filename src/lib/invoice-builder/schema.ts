import { z } from "zod";

export const INVOICE_TEMPLATE_IDS = ["classic", "modern", "minimal", "warm"] as const;

export const invoiceBuilderSchema = z.object({
  templateId: z.enum(INVOICE_TEMPLATE_IDS),
  businessName: z.string().trim().min(1).max(120),
  businessEmail: z.string().trim().email().max(254),
  businessPhone: z.string().trim().max(40).optional().default(""),
  businessAddress: z.string().trim().min(1).max(400),
  clientName: z.string().trim().min(1).max(120),
  clientEmail: z.string().trim().email().max(254),
  clientPhone: z.string().trim().max(40).optional().default(""),
  clientAddress: z.string().trim().min(1).max(400),
  invoiceNumber: z.string().trim().min(1).max(64),
  issueDate: z.string().date(),
  dueDate: z.string().date(),
  currency: z.literal("usd").default("usd"),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().trim().max(1000).optional().default(""),
  paymentTerms: z.string().trim().max(500).optional().default(""),
  signatureName: z.string().trim().min(2).max(100),
  lineItems: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(200),
        quantity: z.number().positive().max(100000),
        unitPrice: z.number().nonnegative().max(100000000),
      }),
    )
    .min(1)
    .max(10),
}).superRefine((data, context) => {
  if (new Date(`${data.dueDate}T00:00:00Z`) < new Date(`${data.issueDate}T00:00:00Z`)) {
    context.addIssue({
      code: "custom",
      path: ["dueDate"],
      message: "Due date cannot be before the invoice date.",
    });
  }
});

export type InvoiceBuilderInput = z.infer<typeof invoiceBuilderSchema>;

export function invoiceTotals(data: InvoiceBuilderInput) {
  const subtotalCents = data.lineItems.reduce(
    (total, item) => total + Math.round(item.quantity * item.unitPrice * 100),
    0,
  );
  const taxCents = Math.round(subtotalCents * (data.taxRate / 100));
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
