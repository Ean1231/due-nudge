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
          {gmailEmail ? (
            <form action={disconnectGmail}>
              <button
                className="btn btn-ghost px-3"
                type="submit"
                title={`Disconnect ${gmailEmail}. Reminders will stop sending until Gmail is connected again.`}
                aria-label={`Disconnect Gmail account ${gmailEmail}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 15-2 2a4 4 0 0 1-6-6l3-3a4 4 0 0 1 5.6-.1" />
                  <path d="m15 9 2-2a4 4 0 0 1 6 6l-3 3a4 4 0 0 1-5.6.1" />
                  <path d="m8 2 1 3M2 8l3 1M16 22l-1-3M22 16l-3-1" />
                </svg>
              </button>
            </form>
          ) : null}
          <span className="hidden text-sm text-[var(--muted)] sm:inline">{label}</span>
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
