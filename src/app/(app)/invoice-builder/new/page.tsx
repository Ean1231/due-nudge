import { addDays, format } from "date-fns";
import { redirect } from "next/navigation";
import { InvoiceBuilderForm } from "@/components/invoice-builder/invoice-builder-form";
import { INVOICE_TEMPLATE_IDS } from "@/lib/invoice-builder/schema";
import { getAppUser } from "@/lib/session";

export default async function NewGeneratedInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const user = await getAppUser();
  if (!user) redirect("/login");
  const requested = (await searchParams).template;
  if (!INVOICE_TEMPLATE_IDS.includes(requested as (typeof INVOICE_TEMPLATE_IDS)[number])) {
    redirect("/invoice-builder");
  }

  const today = new Date();
  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm font-semibold text-[var(--brand)]">Invoice builder</p>
        <h1 className="display mt-2 text-4xl font-semibold">Enter invoice details</h1>
        <p className="mt-2 text-[var(--muted)]">
          The finished PDF is stored privately and attached to every reminder for this invoice.
        </p>
      </div>
      <InvoiceBuilderForm
        templateId={requested as (typeof INVOICE_TEMPLATE_IDS)[number]}
        initialBusinessName={user.businessName || user.name || ""}
        initialBusinessEmail={user.email}
        initialIssueDate={format(today, "yyyy-MM-dd")}
        initialDueDate={format(addDays(today, 14), "yyyy-MM-dd")}
      />
    </main>
  );
}
