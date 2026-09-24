import { z } from "zod";

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  number: z.string().min(1).max(64),
  amount: z.string().min(1),
  currency: z.string().length(3).default("usd"),
  description: z.string().max(500).optional().nullable(),
  dueDate: z.string().min(1),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(["paid", "unpaid"]),
});
