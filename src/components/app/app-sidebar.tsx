"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/invoice-builder", label: "Create invoice" },
  { href: "/documents", label: "My documents" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("duenudge-sidebar") === "collapsed");
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("duenudge-sidebar", next ? "collapsed" : "open");
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className={`flex items-center gap-2 px-3 py-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {collapsed ? null : (
          <Link href="/dashboard" className="display text-lg font-semibold">
            DueNudge
          </Link>
        )}
        <button
          type="button"
          className="btn btn-ghost px-2"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Show menu" : "Hide menu labels"}
          title={collapsed ? "Show menu" : "Collapse menu"}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
          </svg>
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Main">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              aria-current={active ? "page" : undefined}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                active ? "bg-[var(--brand)] text-white" : "text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
              } ${collapsed ? "text-center" : ""}`}
            >
              {collapsed ? link.label.slice(0, 1) : link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
