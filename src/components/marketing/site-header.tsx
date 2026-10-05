import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="display text-2xl font-semibold tracking-tight">
        DueNudge
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold">
        <Link href="/#how" className="text-[var(--muted)] hover:text-[var(--ink)]">
          How it works
        </Link>
        <Link href="/#pricing" className="text-[var(--muted)] hover:text-[var(--ink)]">
          Pricing
        </Link>
        <Link href="/login" className="btn btn-ghost">
          Log in
        </Link>
        <Link href="/register" className="btn btn-primary">
          Try 3 free
        </Link>
      </nav>
    </header>
  );
}
