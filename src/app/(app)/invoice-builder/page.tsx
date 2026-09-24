import Link from "next/link";
import { INVOICE_TEMPLATES } from "@/lib/invoice-builder/templates";

export default function InvoiceBuilderTemplatesPage() {
  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-[var(--brand)]">Invoice builder</p>
        <h1 className="display mt-2 text-4xl font-semibold">Choose an invoice design</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Fill in the invoice, download the PDF, then send it when you are ready. Later reminders use the same PDF.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {INVOICE_TEMPLATES.map((template) => (
          <Link
            key={template.id}
            href={`/invoice-builder/new?template=${template.id}`}
            className="panel group block p-3 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <TemplatePreview templateId={template.id} accentClass={template.previewClass} />
            <h2 className="display mt-3 text-xl font-semibold">{template.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{template.description}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-[var(--brand)] group-hover:underline">
              Use this design
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

function TemplatePreview({
  templateId,
  accentClass,
}: {
  templateId: "classic" | "modern" | "minimal" | "warm";
  accentClass: string;
}) {
  return (
    <div className="mx-auto aspect-[210/297] w-full max-w-52 overflow-hidden border border-[#cbc8c1] bg-white p-3 shadow-sm">
      <div className={templateId === "warm" ? "-mx-3 -mt-3 mb-3 flex h-12 items-center justify-between bg-[#17130f] px-3" : "mb-3 flex items-center justify-between"}>
        <div className={`h-5 w-12 ${templateId === "minimal" ? "bg-[#222]" : accentClass}`} />
        <div className={`text-[9px] font-bold tracking-widest ${templateId === "warm" ? "text-white" : "text-[#222]"}`}>
          INVOICE
        </div>
      </div>
      {templateId === "classic" ? <div className={`mb-2 h-1 w-full ${accentClass}`} /> : null}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="h-1 w-8 bg-[#999]" />
          <div className="h-1 w-14 bg-[#ccc]" />
          <div className="h-1 w-12 bg-[#ddd]" />
        </div>
        <div className="space-y-1 text-right">
          <div className="ml-auto h-1 w-7 bg-[#999]" />
          <div className="ml-auto h-1 w-12 bg-[#ccc]" />
          <div className="ml-auto h-1 w-10 bg-[#ddd]" />
        </div>
      </div>
      <div className={`mb-1 h-4 ${templateId === "minimal" ? "bg-[#d5d5d5]" : accentClass}`} />
      <div className="space-y-1">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className={`h-3 border-b border-[#ddd] ${templateId === "minimal" && row % 2 ? "bg-[#eee]" : ""}`} />
        ))}
      </div>
      <div className="ml-auto mt-3 w-24 space-y-1">
        <div className="h-2 border-b border-[#aaa]" />
        <div className="h-2 border-b border-[#aaa]" />
        <div className={`h-4 ${templateId === "minimal" ? "bg-[#d5d5d5]" : accentClass}`} />
      </div>
      <div className="ml-auto mt-5 h-3 w-16 border-b border-[#777]" />
    </div>
  );
}
