import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="display text-2xl font-semibold tracking-tight">
        DueNudge
      </Link>
      <nav className="flex items-center gap-3">
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
