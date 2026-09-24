import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeGmailCode, readGmailState } from "@/lib/gmail/oauth";
import { encryptGmailToken } from "@/lib/gmail/token";
import { getAppUser } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appUrl = url.origin;
  const user = await getAppUser();
  if (!user) return NextResponse.redirect(new URL("/login", appUrl));

  const code = url.searchParams.get("code");
  const stateUserId = readGmailState(url.searchParams.get("state") || "");
  if (!code || stateUserId !== user.id) {
    return NextResponse.redirect(new URL("/dashboard?gmail=failed", appUrl));
  }

  try {
    const connected = await exchangeGmailCode(code);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        gmailEmail: connected.email,
        gmailRefreshToken: encryptGmailToken(connected.refreshToken),
      },
    });
  } catch (err) {
    console.error("[DueNudge] Gmail connect failed:", err);
    return NextResponse.redirect(new URL("/dashboard?gmail=failed", appUrl));
  }

  return NextResponse.redirect(new URL("/dashboard?gmail=connected", appUrl));
}
