import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { verifyEmailToken } from "@/lib/security/email-verification";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const confirmed = await verifyEmailToken((await searchParams).token);

  return (
    <AuthShell
      title={confirmed ? "Email confirmed" : "Link not valid"}
      subtitle={
        confirmed
          ? "You can log in and connect Gmail."
          : "This confirmation link is missing, expired, or already used."
      }
      footer={<Link href="/login">Log in</Link>}
    >
      <div className="panel mt-8">
        <Link className="btn btn-primary w-full" href="/login">
          Go to login
        </Link>
      </div>
    </AuthShell>
  );
}
