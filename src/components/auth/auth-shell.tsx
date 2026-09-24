import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="display mb-8 text-2xl font-semibold">
        DueNudge
      </Link>
      <h1 className="display text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-[var(--muted)]">{subtitle}</p>
      {children}
      <p className="mt-4 text-sm text-[var(--muted)]">{footer}</p>
    </main>
  );
}
