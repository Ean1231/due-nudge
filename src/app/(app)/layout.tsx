import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasActiveSubscription, isBillingRequired } from "@/lib/reminders";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/billing", label: "Billing" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  const needsBilling = isBillingRequired() && !hasActiveSubscription(user.subscriptionStatus);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[rgba(251,254,253,0.8)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="display text-xl font-semibold">
              DueNudge
            </Link>
            <nav className="hidden gap-4 text-sm font-semibold text-[var(--muted)] md:flex">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-[var(--ink)]">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--muted)] sm:inline">
              {user.businessName || user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="btn btn-ghost" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-3 overflow-x-auto px-6 pb-3 text-sm font-semibold text-[var(--muted)] md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {needsBilling ? (
        <div className="border-b border-[var(--line)] bg-[#fff7df] px-6 py-3 text-center text-sm">
          Start your 7-day trial to send reminders.{" "}
          <Link href="/billing" className="font-semibold underline">
            Go to billing
          </Link>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
