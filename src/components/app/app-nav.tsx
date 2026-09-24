"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/billing", label: "Billing" },
];

export function AppNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={
        mobile
          ? "mx-auto flex w-full max-w-6xl gap-3 overflow-x-auto px-6 pb-3 text-sm font-semibold md:hidden"
          : "hidden gap-4 text-sm font-semibold md:flex"
      }
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "text-[var(--brand)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
