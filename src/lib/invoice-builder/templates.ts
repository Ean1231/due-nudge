import type { InvoiceBuilderInput } from "@/lib/invoice-builder/schema";

export const INVOICE_TEMPLATES: Array<{
  id: InvoiceBuilderInput["templateId"];
  name: string;
  description: string;
  previewClass: string;
}> = [
  {
    id: "classic",
    name: "Classic Green",
    description: "A compact green business invoice with clear totals and signature.",
    previewClass: "bg-[#078f70]",
  },
  {
    id: "modern",
    name: "Corporate Blue",
    description: "A bordered corporate layout with a structured item table.",
    previewClass: "bg-[#1558b0]",
  },
  {
    id: "minimal",
    name: "Minimal Black",
    description: "A grayscale service invoice with alternating line-item rows.",
    previewClass: "bg-[#171717]",
  },
  {
    id: "warm",
    name: "Black & Orange",
    description: "A bold header and payment panel for modern independent businesses.",
    previewClass: "bg-[#d87916]",
  },
];
