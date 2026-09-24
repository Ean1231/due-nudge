import type { InvoiceBuilderInput } from "@/lib/invoice-builder/schema";

export const INVOICE_TEMPLATES: Array<{
  id: InvoiceBuilderInput["templateId"];
  name: string;
  description: string;
  previewClass: string;
}> = [
  {
    id: "classic",
    name: "Classic Navy",
    description: "Traditional, confident, and suited to professional services.",
    previewClass: "bg-[#12386b]",
  },
  {
    id: "modern",
    name: "Modern Mint",
    description: "Fresh green accents with a clean contemporary layout.",
    previewClass: "bg-[#078c73]",
  },
  {
    id: "minimal",
    name: "Minimal Black",
    description: "Simple typography with no unnecessary decoration.",
    previewClass: "bg-[#171717]",
  },
  {
    id: "warm",
    name: "Warm Studio",
    description: "A friendly rust palette for independent creative work.",
    previewClass: "bg-[#a83d24]",
  },
];
