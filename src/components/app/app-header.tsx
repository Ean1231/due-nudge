import Link from "next/link";
import { AppNav } from "@/components/app/app-nav";
import { signOut } from "@/lib/auth";
import { disconnectGmail } from "@/lib/gmail/actions";

export function AppHeader({ label, gmailEmail }: { label: string; gmailEmail?: string | null }) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="display text-xl font-semibold">
            DueNudge
          </Link>
          <AppNav />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[var(--muted)] sm:inline">{label}</span>
          {gmailEmail ? (
            <form action={disconnectGmail}>
              <button className="btn btn-ghost" type="submit">
                Disconnect {gmailEmail}
              </button>
            </form>
          ) : null}
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
      <AppNav mobile />
    </header>
  );
}
