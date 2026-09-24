import { addDays, format } from "date-fns";
import { redirect } from "next/navigation";
import { InvoiceBuilderForm } from "@/components/invoice-builder/invoice-builder-form";
import { prisma } from "@/lib/db";
import { INVOICE_TEMPLATE_IDS, invoiceBuilderSchema, type InvoiceBuilderInput } from "@/lib/invoice-builder/schema";
import { getAppUser } from "@/lib/session";

export default async function NewGeneratedInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; from?: string }>;
}) {
  const user = await getAppUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const today = new Date();
  let saved: InvoiceBuilderInput | null = null;
  if (params.from) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.from, userId: user.id },
      select: { invoiceData: true },
    });
    const parsed = invoiceBuilderSchema.safeParse(invoice?.invoiceData);
    if (!parsed.success) redirect("/invoice-builder");
    saved = parsed.data;
  }
  const requested = saved?.templateId || params.template;
  if (!INVOICE_TEMPLATE_IDS.includes(requested as (typeof INVOICE_TEMPLATE_IDS)[number])) {
    redirect("/invoice-builder");
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm font-semibold text-[var(--brand)]">Invoice builder</p>
        <h1 className="display mt-2 text-4xl font-semibold">Enter invoice details</h1>
        <p className="mt-2 text-[var(--muted)]">
          {saved
            ? `Started from ${saved.invoiceNumber}. Enter a new invoice number before you create it.`
            : "Nothing is emailed until you choose Send reminder on the last screen."}
        </p>
      </div>
      <InvoiceBuilderForm
        templateId={requested as (typeof INVOICE_TEMPLATE_IDS)[number]}
        initialBusinessName={saved?.businessName || user.businessName || user.name || ""}
        initialBusinessEmail={saved?.businessEmail || user.email}
        initialIssueDate={format(today, "yyyy-MM-dd")}
        initialDueDate={format(addDays(today, 14), "yyyy-MM-dd")}
        saved={saved}
      />
    </main>
  );
}
