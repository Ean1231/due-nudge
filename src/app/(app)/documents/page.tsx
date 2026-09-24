import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getAppUser } from "@/lib/session";

export default async function DocumentsPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  const documents = await prisma.invoice.findMany({
    where: { userId: user.id, attachmentPath: { not: null } },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--brand)]">Saved invoices</p>
          <h1 className="display mt-2 text-4xl font-semibold">My documents</h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Every invoice you create is saved here. Open it in the browser or download the PDF again.
          </p>
        </div>
        <Link className="btn btn-primary" href="/invoice-builder">
          Create invoice
        </Link>
      </div>

      {documents.length === 0 ? (
        <section className="panel">
          <p className="text-[var(--muted)]">No saved invoices yet. Create one and it will appear here.</p>
        </section>
      ) : (
        <section className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[var(--muted)]">
                <th className="py-2 pr-4 font-medium">Invoice</th>
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Saved</th>
                <th className="py-2 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-t border-[var(--line)]">
                  <td className="py-3 pr-4 font-semibold">{document.number}</td>
                  <td className="py-3 pr-4">{document.client.name}</td>
                  <td className="py-3 pr-4">{formatMoney(document.amountCents, document.currency)}</td>
                  <td className="py-3 pr-4">{format(document.createdAt, "d MMM yyyy")}</td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <a className="font-semibold text-[var(--brand)]" href={`/api/invoices/${document.id}/attachment?view=1`} target="_blank" rel="noreferrer">
                        View
                      </a>
                      <a className="font-semibold text-[var(--brand)]" href={`/api/invoices/${document.id}/attachment`}>
                        Download
                      </a>
                      {document.invoiceData ? (
                        <Link className="font-semibold text-[var(--brand)]" href={`/invoice-builder/new?from=${document.id}`}>
                          Use again
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
