import { formatMoney } from "@/lib/money";

type Props = {
  outstandingCents: number;
  unpaidCount: number;
  clientCount: number;
};

export function DashboardStats({ outstandingCents, unpaidCount, clientCount }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Stat label="Outstanding" value={formatMoney(outstandingCents)} />
      <Stat label="Unpaid invoices" value={String(unpaidCount)} />
      <Stat label="Clients" value={String(clientCount)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="display mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
