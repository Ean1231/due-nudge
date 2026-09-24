import Link from "next/link";
import { INVOICE_TEMPLATES } from "@/lib/invoice-builder/templates";

export default function InvoiceBuilderTemplatesPage() {
  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-[var(--brand)]">Invoice builder</p>
        <h1 className="display mt-2 text-4xl font-semibold">Choose an invoice design</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Enter the details once. DueNudge generates a private PDF, stores it with the invoice,
          and attaches it to every reminder.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {INVOICE_TEMPLATES.map((template) => (
          <Link
            key={template.id}
            href={`/invoice-builder/new?template=${template.id}`}
            className="panel group block transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="overflow-hidden rounded border border-[var(--line)] bg-white">
              <div className={`h-16 ${template.previewClass}`} />
              <div className="space-y-3 p-5">
                <div className="flex justify-between gap-4">
                  <div className="h-3 w-28 bg-[#d9d6cf]" />
                  <div className="h-3 w-16 bg-[#d9d6cf]" />
                </div>
                <div className="grid grid-cols-2 gap-8 py-4">
                  <div className="space-y-2">
                    <div className="h-2 w-12 bg-[#ebe8e1]" />
                    <div className="h-2 w-24 bg-[#d9d6cf]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-12 bg-[#ebe8e1]" />
                    <div className="h-2 w-24 bg-[#d9d6cf]" />
                  </div>
                </div>
                <div className={`h-5 ${template.previewClass}`} />
                <div className="space-y-2">
                  <div className="h-2 w-full bg-[#ebe8e1]" />
                  <div className="h-2 w-full bg-[#f2f0eb]" />
                  <div className="ml-auto h-3 w-28 bg-[#d9d6cf]" />
                </div>
              </div>
            </div>
            <h2 className="display mt-5 text-2xl font-semibold">{template.name}</h2>
            <p className="mt-1 text-[var(--muted)]">{template.description}</p>
            <span className="mt-4 inline-block font-semibold text-[var(--brand)] group-hover:underline">
              Use this design
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
